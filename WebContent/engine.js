function evalCmds(bInitializing)
{
    var aCmds = location.hash.split("/");
    switch (aCmds[1])
    {
        case "":
            // main view, thumbnail list
            if (jScaledImgOverlay.is(":visible"))
            {
                jScaledImgOverlay.add(jCommentSection).fadeOut(200, function()
                {
                    jCurrentScaledImg.attr("src", "");
                    jScaledImgLoader.show();
                });
                jMenuSection.fadeIn(200);
                jUploadSection.fadeIn(200);
                if (jCommentList != null)
                {
                    jCommentList.remove();
                    jCommentList = null;
                }
            }
            break;
        case "fullsize":
            // full size view
            // load the image
            var sImgId = aCmds[2].substr(0, aCmds[2].lastIndexOf('.'));
            if (jScaledImgOverlay.is(":hidden"))
            {
                jCurrentScaledImg.attr("src", "./img/" + aCmds[2]);
                jCurrentScaledImg.attr("imgid", sImgId);
                if (bInitializing)
                {
                    jScaledImgOverlay.add(jCommentSection).show();
                    jUploadSection.hide();
                    jMenuSection.hide();
                }
                else
                {
                    jScaledImgOverlay.add(jCommentSection).fadeIn(200);
                    jUploadSection.fadeOut(200);
                    jMenuSection.fadeOut(200);
                }
            }
            else
            {
                jNextScaledImg.attr("src", "./img/" + aCmds[2]);
                jNextScaledImg.attr("imgid", sImgId);

                function swapScaledImgs()
                {
                    var jTemp = jCurrentScaledImg;
                    jCurrentScaledImg = jNextScaledImg;
                    jNextScaledImg = jTemp;
                    
                    jCurrentScaledImg.attr("id", "next-scaled-img");
                    jNextScaledImg.attr(
                            {
                                id: "current-scaled-img",
                                src: ""
                            });
                }

                // fade from current to next image
                jCurrentScaledImg
                    .css("opacity", "1")
                    .animate({opacity: "0"}, 200, "linear");
                jNextScaledImg
                    .css("opacity", "0")
                    .animate({opacity: "1"}, 200, "linear", swapScaledImgs);
            }
            jCommentImgIdInput.val(sImgId);
            loadComments(sImgId);
            break;
    }
}

function navToImage(sDirection)
{
    var sImgId = jCurrentScaledImg.attr("imgid");
    var sNextImgId = "";
    if (sDirection == "prev")
    {
        sNextImgId = (parseInt(sImgId) + 1).toString();
    }
    else if (sDirection == "next")
    {
        sNextImgId = (parseInt(sImgId) - 1).toString();
    }

    var sNextImgHref = $("#thumb-" + sNextImgId)
        .find(".thumb-link")
        .attr("href");

    if (sNextImgHref != undefined)
        location.href = sNextImgHref;
}

function toHumanFileSize(iBytes)
{
    var iThresh = 1024;
    if (iBytes < iThresh)
        return iBytes + ' B';
    var units = [ 'kB', 'MB' ];
    var iUnitI = -1;
    do
    {
        iBytes /= iThresh;
        ++iUnitI;
    }
    while (iBytes >= iThresh);
    return iBytes.toFixed(1) + ' ' + units[iUnitI];
};

function loadComments(sImgId)
{
    $.getJSON("./get-comments?imgid=" + sImgId, function(oData)
    {
        sCommentList = '<ul id="comment-list">';
        $.each(oData, function(i, oComment)
        {
            sCommentList += '<li class="comment">'
                    + '<a class="comment-name" href="mailto:' + oComment.email
                    + '">' + oComment.name + '</a>'
                    + '<blockquote class="comment-text">' + oComment.text
                    + '</blockquote></li>';
        });
        sCommentList += '</ul>';
        jCommentListWrapper.html(sCommentList);
        jCommentListWrapper.click(function(oEvent)
        {
            // if the mailto: link is empty, block clicking
            var nElem = oEvent.target;
            return !nElem.classList.contains("comment-name")
                    || nElem.href != "mailto:";
        });
    });
}

function tryPostComment()
{
    if (jCommentNameInput.val().length == 0
            || jCommentTextInput.val().length == 0)
        // let browser indicate an error
        return;

    function fRespHandler(sResponse)
    {
        if (sResponse == "OK")
            location.reload();
        else
        {
            alert("Beim Abschicken des Kommentars trat ein Fehler auf.\nBitte versuche es sp�ter noch einmal");
        }
    }

    $.ajax(
    {
        type : "POST",
        url : "./post-comment",
        data :
        {
            name : jCommentNameInput.val(),
            email : jCommentEmailInput.val(),
            text : jCommentTextInput.val(),
            imgid : jCommentImgIdInput.val()
        },
        success : fRespHandler,
        error : fRespHandler
    });

    return;
}

function tryUploadImage()
{
    bSending = true;

    jFileInfoLoaderWrapper.fadeIn(200);

    jFileInfoStatus.removeClass("error");
    jFileInfoStatus.text("Sende... 0%");

    var oData = new FormData();
    oData.append("image-file", oSelFile);

    function fRespHandler(oEvent)
    {
        if (oEvent.type == "load" && oEvent.target.response == "OK")
        {
            // upload successful
            jFileInfoStatus.text("Sende... 100%");
            location.reload();
        }
        else
        {
            jFileInfoLoaderWrapper.fadeOut(200);

            jFileInfoStatus.addClass("error");
            jFileInfoStatus.text("Upload-Fehler!");
        }

        bSending = false;
    }

    var oReq = new XMLHttpRequest();
    oReq.upload.onprogress = function(oEvent)
    {
        if (!oEvent.lengthComputable)
            return;

        jFileInfoStatus.text("Sende... "
                + Math.floor((oEvent.loaded / oEvent.total) * 100.0) + "%");
    };
    oReq.onload = fRespHandler;
    oReq.onerror = fRespHandler;
    oReq.open("POST", "./post-image", true);
    oReq.send(oData);

    // block browser redirect
    return true;
}

function validateFile(oFile)
{
    if (oFile.type.substr(0, 6) != "image/")
        // selected file is no image
        return;

    var oReader = new FileReader();
    oReader.onload = function(oEvent)
    {
        if (jFileInfoWrapper.is(":hidden"))
        {
            // replace the "drop here" text with the file info and preview
            jFileDropText.fadeOut(200);
            jFileInfoWrapper.fadeIn(200);
        }
        jFileInfoPrev.attr("src", oEvent.target.result);
    };
    jFileInfoName.text(escape(oFile.name));
    jFileInfoSize.text(toHumanFileSize(oFile.size));

    if (jFileInfoPrevWrapper.is(":visible"))
        jFileInfoPrevWrapper.fadeOut(200, function()
        {
            oReader.readAsDataURL(oFile);
        });
    else
        oReader.readAsDataURL(oFile);

    oSelFile = null;

    if (oFile.size > iMaxUploadImgByteSize)
    {
        jFileInfoStatus.addClass("error");
        jFileInfoStatus
                .text(">" + toHumanFileSize(iMaxUploadImgByteSize) + "!");
    }
    else if (aAllowedUploadImgMimes.indexOf(oFile.type.substr(6)) == -1)
    {
        jFileInfoStatus.addClass("error");
        jFileInfoStatus.text("Unerlaubter Typ!");
    }
    else
    {
        jFileInfoStatus.removeClass("error");
        jFileInfoStatus.text("OK!");

        oSelFile = oFile;
    }
}

function onFileDropZoneDragOver(oEvent)
{
    if (bSending)
        return;

    jFileDropZone.addClass("dragged");
    
    // prevent the browser from trying to open the dropped file
    oEvent.stopPropagation();
    oEvent.preventDefault();
}

function onFileDropZoneDragLeave(oEvent)
{
    if (bSending)
        return;

    jFileDropZone.removeClass("dragged");
    oEvent.stopPropagation();
    oEvent.preventDefault();
}

function onFileDropZoneDrop(oEvent)
{
    if (bSending)
        return;

    onFileDropZoneDragLeave(oEvent);
    var oFile = oEvent.originalEvent.dataTransfer.files[0];
    
    if (oFile === undefined)
        // dropped item was not a file
        return;
    
    validateFile(oFile);
}

function onFileDropZoneClick(oEvent)
{
    if (bSending)
        return;

    // prevent click recursion
    if (oEvent.target != jFileInput.get(0))
        jFileInput.click();
}

function onFileInputChange(oEvent)
{
    var oFile = oEvent.target.files[0];
    validateFile(oFile);
}

function onFileUploadButtonClick()
{
    if (oSelFile === null)
        // no file selected, let browser indicate an error
        return true;

    tryUploadImage();
    return false;
}

function onScaledImgOverlayClicked(oEvent)
{
    var nElem = oEvent.target;
    if (nElem.classList.contains("scaled-img-nav-btn"))
    {
        navToImage(nElem.id == "scaled-img-nav-btn-left" ? "prev" : "next");
        return false;
    }
    location.href = "./#/";
    return true;
}

function onWindowKeydown(oEvent)
{
    if (jScaledImgOverlay.is(":hidden"))
        return;
    
    switch (oEvent.target.nodeName)
    {
        case "TEXTAREA":
        case "INPUT":
            // allow cursor navigation within text inputs
            return;
    }
    
    switch (oEvent.keyCode)
    {
        case 39:
            // right arrow
            navToImage("next");
            break;
        case 37:
            // left arrow
            navToImage("prev");
            break;
        default:
            return true;
    }
    return false;
}

var iMaxUploadImgByteSize = 5 * 1024 * 1024;
var aAllowedUploadImgMimes = [ "gif", "jpeg", "pjpeg", "png" ];

var bSending, oSelFile;

var jScaledImgOverlay;
var jCurrentScaledImg, jNextScaledImg;
var jScaledImgLoader;
var jNavBtnLeft, jNavBtnRight;

var jSidebarMenu;

var jUploadSection, jUploadForm, jFileDropZone, jFileInput;
var jMenuSection;

var jFileInfoWrapper, jFileInfoName, jFileInfoSize, jFileInfoStatus;
var jFileInfoPrev, jFileInfoPrevWrapper, jFileInfoLoaderWrapper, jFileDropText;
var jFileSubmitButton;

var jCommentSection, jCommentListWrapper, jCommentList;
var jCommentForm, jCommentNameInput, jCommentEmailInput;
var jCommentImgIdInput, jCommentTextInput;

$(document).ready(function()
    {
        if (location.hash.substr(0, 2) != "#/")
        {
            location.href = "./#/";
        }

        $(window).keydown(onWindowKeydown);

        bSending = false;

        jSidebarMenu = $("#sidebar-menu");

        jMenuSection = jSidebarMenu.find("#menu-section");
        jUploadSection = jSidebarMenu.find("#upload-section");
        jUploadForm    = jUploadSection.find("#upload-form");

        jFileInput = jUploadSection
            .find("#file-input")
            .change(onFileInputChange)
            .val("");
        jFileDropZone = jUploadSection
            .find("#file-drop-zone")
            .on({
                    dragover:  onFileDropZoneDragOver,
                    dragleave: onFileDropZoneDragLeave,
                    drop:      onFileDropZoneDrop,
                    click:     onFileDropZoneClick
            });
        jFileDropText = jUploadSection.find("#file-drop-text");
        jFileSubmitButton      = jUploadSection
            .find("#file-submit-button")
            .click(onFileUploadButtonClick);

        jFileInfoWrapper     = jUploadSection.find("#file-info-wrapper");
        jFileInfoPrevWrapper = jFileInfoWrapper.find("#file-info-preview-wrapper");
        jFileInfoPrev        = jFileInfoPrevWrapper
            .find("#file-info-preview")
            .load(function(oEvent)
            {
                jFileInfoPrevWrapper.fadeIn(200);
            });
        jFileInfoLoaderWrapper = jFileInfoWrapper.find("#file-info-loader-wrapper");
        jFileInfoName          = jFileInfoWrapper.find("#file-info-name");
        jFileInfoSize          = jFileInfoWrapper.find("#file-info-size");
        jFileInfoStatus        = jFileInfoWrapper.find("#file-info-status");

        oSelFile = null;

        jCommentSection     = jSidebarMenu.find("#comment-section");
        jCommentListWrapper = jCommentSection.find("#comment-list-wrapper");
        jCommentList        = null;
        jCommentForm        = jCommentSection.find("#comment-form");
        jCommentNameInput   = jCommentSection.find("#comment-name-input");
        jCommentEmailInput  = jCommentSection.find("#comment-email-input");
        jCommentImgIdInput  = jCommentSection.find("#comment-imgid-input");
        jCommentTextInput   = jCommentSection.find("#comment-text-input");

        jScaledImgOverlay = $("#scaled-img-overlay")
            .click(onScaledImgOverlayClicked);

        jScaledImgLoader  = $("#scaled-img-loader");
        jCurrentScaledImg = $("#current-scaled-img")
            .on("load", function()
            {
                jScaledImgLoader.hide();
            });
        jNextScaledImg = $("#next-scaled-img");

        jNavBtnLeft  = $("#scaled-img-nav-btn-left");
        jNavBtnRight = $("#scaled-img-nav-btn-right");

        evalCmds(true);
    });

$(window).on("hashchange", function()
{
    evalCmds(false);
});
