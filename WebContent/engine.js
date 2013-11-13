function evalCmds(initializing)
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
                    jLoadingImg.show();
                });
                jUploadSection.fadeIn(200);
            }
            break;
        case "fullsize":
            // full size view
            // load the image
            jCurrentScaledImg.attr("src", "./img/" + aCmds[2]);
            if (jScaledImgOverlay.is(":hidden"))
            {
                jScaledImgOverlay.add(jCommentSection).fadeIn(200);
                jUploadSection.fadeOut(200);
            }
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

function tryUploadImage()
{
    if (oSelFile === null)
        // no file selected
        return;

    var oData = new FormData();
    oData.append("image-file", oSelFile);
    
    var oReq = new XMLHttpRequest();
    oReq.open("POST", "./", false);
    oReq.upload.onprogress = function(oEvent)
    {
        console.debug(oEvent);
        if (oEvent.lengthComputable)
        {
            var percentComplete = oEvent.loaded / oEvent.total;
            console.log(percentComplete + "%");
        }
    };
    oReq.upload.onload = function(oEvent)
    {
        console.debug("load", oEvent);
    };
    oReq.upload.onerror = function(oEvent)
    {
        console.debug("error", oEvent);
    };
    oReq.send(oData);
}

function validateFile(oFile)
{
    if (!oFile.type.startsWith("image/"))
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
    oSelFile = oFile;
    oReader.readAsDataURL(oFile);
}

function onFileDropZoneDragOver(oEvent)
{
    jFileDropZone.addClass("dragged");
    oEvent.stopPropagation();
    oEvent.preventDefault();
}

function onFileDropZoneDragLeave(oEvent)
{
    jFileDropZone.removeClass("dragged");
    oEvent.stopPropagation();
    oEvent.preventDefault();
}

function onFileDropZoneDrop(oEvent)
{
    onFileDropZoneDragLeave(oEvent);
    var oFile = oEvent.originalEvent.dataTransfer.files[0];
    validateFile(oFile);
}

function onFileDropZoneClick(oEvent)
{
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

var jScaledImgOverlay;
var jCurrentScaledImg;
var jNextScaledImg;
var jSidebarMenu;
var jUploadSection, jUploadForm, jFileDropZone, jFileInput;
var jFileInfoWrapper, jFileInfoName, jFileInfoSize, jFileInfoPrev, jFileDropText;
var oSelFile;
var jCommentSection;
var jLoadingImg;

$(document).ready(function()
{
    if (location.hash.substr(0, 2) != "#/")
    {
        location.href = "./#/";
    }

    onWindowResize();
    $(window).resize(onWindowResize);

    jSidebarMenu = $("#sidebar-menu");

    jUploadSection = jSidebarMenu.find("#upload-section");
    jUploadForm = jUploadSection.find("#upload-form");

    jFileInput = jUploadSection.find("#file-input");
    jFileInput.change(onFileInputChange);
    jFileDropZone = jUploadSection.find("#file-drop-zone");
    jFileDropZone.on("dragover", onFileDropZoneDragOver);
    jFileDropZone.on("dragleave", onFileDropZoneDragLeave);
    jFileDropZone.on("drop", onFileDropZoneDrop);
    jFileDropZone.click(onFileDropZoneClick);
    jFileDropText = jUploadSection.find("#file-drop-text");

    jFileInfoWrapper = jUploadSection.find("#file-info-wrapper");
    jFileInfoPrev = jFileInfoWrapper.find("#file-info-preview");
    jFileInfoName = jFileInfoWrapper.find("#file-info-name");
    jFileInfoSize = jFileInfoWrapper.find("#file-info-size");

    oSelFile = null;

    jCommentSection = jSidebarMenu.find("#comment-section");

    jScaledImgOverlay = $("#scaled-img-overlay");
    jScaledImgOverlay.click(onScaledImgOverlayClicked);

    jLoadingImg = $("#loading-img");
    jCurrentScaledImg = $("#current-scaled-img");
    jCurrentScaledImg.on("load", function()
    {
        jLoadingImg.hide();
    });
    jNextScaledImg = $("#next-scaled-img");

    evalCmds(true);
});

$(window).on("hashchange", function()
{
    evalCmds(false);
});