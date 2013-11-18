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
            jCurrentScaledImg.attr("src", "./img/" + aCmds[2]);
            if (jScaledImgOverlay.is(":hidden"))
            {
                if (bInitializing)
                {
                    jScaledImgOverlay.add(jCommentSection).show();
                    jUploadSection.hide();
                }
                else
                {
                    jScaledImgOverlay.add(jCommentSection).fadeIn(200);
                    jUploadSection.fadeOut(200);
                }
            }
            var sImgId = aCmds[2].substr(0, aCmds[2].lastIndexOf('.'));
            jCommentImgIdInput.val(sImgId);
            loadComments(sImgId);
            break;
    }
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
        jCommentList = $('<ul id="comment-list"></ul>');
        $.each(oData, function(i, oComment)
        {
            jCommentList.append('<li class="comment">'
                    + '<a class="comment-name" href="mailto:' + oComment.email
                    + '">' + oComment.name + '</a>'
                    + '<blockquote class="comment-text">' + oComment.text
                    + '</blockquote></li>');
        });
        jCommentListWrapper.append(jCommentList);
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
            alert("Beim Abschicken des Kommentars trat ein Fehler auf.\nBitte versuche es später noch einmal");
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
    if (oSelFile === null)
        // no file selected, let browser indicate an error
        return;

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
    return;
}

function validateFile(oFile)
{
    if (oFile.type.substr(0, 6) != "image/")
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

function onScaledImgOverlayClicked(oEvent)
{
    location.href = "./#/";
}

function onWindowResize(oEvent)
{

}

var iMaxUploadImgByteSize = 5 * 1024 * 1024;
var aAllowedUploadImgMimes = [ "gif", "jpeg", "pjpeg", "png" ];

var bSending, oSelFile;

var jScaledImgOverlay;
var jCurrentScaledImg, jNextScaledImg;
var jScaledImgLoader;

var jSidebarMenu;

var jUploadSection, jUploadForm, jFileDropZone, jFileInput;

var jFileInfoWrapper, jFileInfoName, jFileInfoSize, jFileInfoStatus;
var jFileInfoPrev, jFileInfoPrevWrapper, jFileInfoLoaderWrapper, jFileDropText;

var jCommentSection, jCommentListWrapper, jCommentList;
var jCommentForm, jCommentNameInput, jCommentEmailInput;
var jCommentImgIdInput, jCommentTextInput;

$(document)
        .ready(
                function()
                {
                    if (location.hash.substr(0, 2) != "#/")
                    {
                        location.href = "./#/";
                    }

                    onWindowResize();
                    $(window).resize(onWindowResize);

                    bSending = false;

                    jSidebarMenu = $("#sidebar-menu");

                    jUploadSection = jSidebarMenu.find("#upload-section");
                    jUploadForm = jUploadSection.find("#upload-form");

                    jFileInput = jUploadSection.find("#file-input");
                    jFileInput.change(onFileInputChange);
                    jFileInput.val("");
                    jFileDropZone = jUploadSection.find("#file-drop-zone");
                    jFileDropZone.on("dragover", onFileDropZoneDragOver);
                    jFileDropZone.on("dragleave", onFileDropZoneDragLeave);
                    jFileDropZone.on("drop", onFileDropZoneDrop);
                    jFileDropZone.click(onFileDropZoneClick);
                    jFileDropText = jUploadSection.find("#file-drop-text");

                    jFileInfoWrapper = jUploadSection
                            .find("#file-info-wrapper");
                    jFileInfoPrevWrapper = jFileInfoWrapper
                            .find("#file-info-preview-wrapper");
                    jFileInfoPrev = jFileInfoPrevWrapper
                            .find("#file-info-preview");
                    jFileInfoPrev.load(function(oEvent)
                    {
                        jFileInfoPrevWrapper.fadeIn(200);
                    });
                    jFileInfoLoaderWrapper = jFileInfoWrapper
                            .find("#file-info-loader-wrapper");
                    jFileInfoName = jFileInfoWrapper.find("#file-info-name");
                    jFileInfoSize = jFileInfoWrapper.find("#file-info-size");
                    jFileInfoStatus = jFileInfoWrapper
                            .find("#file-info-status");

                    oSelFile = null;

                    jCommentSection = jSidebarMenu.find("#comment-section");
                    jCommentListWrapper = jCommentSection
                            .find("#comment-list-wrapper");
                    jCommentList = null;
                    jCommentForm = jCommentSection.find("#comment-form");
                    jCommentNameInput = jCommentSection
                            .find("#comment-name-input");
                    jCommentEmailInput = jCommentSection
                            .find("#comment-email-input");
                    jCommentImgIdInput = jCommentSection
                            .find("#comment-imgid-input");
                    jCommentTextInput = jCommentSection
                            .find("#comment-text-input");

                    jScaledImgOverlay = $("#scaled-img-overlay");
                    jScaledImgOverlay.click(onScaledImgOverlayClicked);

                    jScaledImgLoader = $("#scaled-img-loader");
                    jCurrentScaledImg = $("#current-scaled-img");
                    jCurrentScaledImg.on("load", function()
                    {
                        jScaledImgLoader.hide();
                    });
                    jNextScaledImg = $("#next-scaled-img");

                    evalCmds(true);
                });

$(window).on("hashchange", function()
{
    evalCmds(false);
});