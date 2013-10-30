
function evalCmds(initializing)
{
  var aCmds = location.hash.split("/");
  switch (aCmds[1])
  {
    case "":
      // main view, thumbnail list
      if (jFullSizeOverlay.css("display") == "block")
      {
        jFullSizeOverlay.css("opacity", "0");
      }
      break;
    case "fullsize":
      // full size view
      // load the image
      jFullSizeImg.attr("src", "/imgch/img/" + aCmds[2]);
      if (jFullSizeOverlay.css("display") == "none")
      {
        jFullSizeOverlay.css("display", "block");
        setTimeout(function ()
        {
          // overlay is visible, fade it in
          jFullSizeOverlay.css("opacity", "1");
        }, 0);
      }
      break;
  }
}

function fullSizeOverlayTransEnd(oEvent)
{
  // full size overlay animation ended
  if (jFullSizeOverlay.css("opacity") == "0")
  {
    // faded out
    jFullSizeOverlay.hide();
  }
}

function fullSizeOverlayClick(oEvent)
{
  switch (oEvent.target.id)
  {
    case "fullsize-overlay":
    case "fullsize-wrapper":
    case "fullsize-img":
      location.href = "/imgch/#/";
      break;
  }
}

var jFullSizeOverlay;
var jFullSizeImg;

$(document).ready(function ()
{
	if ((location.pathname + location.hash).substr(0, 9) != "/imgch/#/")
  {
		location.href = "/imgch/#/";
  }
  
  jFullSizeOverlay = $("#fullsize-overlay");
  jFullSizeOverlay.on("transitionend", fullSizeOverlayTransEnd);
  jFullSizeOverlay.click(fullSizeOverlayClick);
  jFullSizeImg = $("#fullsize-img");
  evalCmds(true);
});

$(window).on("hashchange", function ()
{
  evalCmds(false);
});