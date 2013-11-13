<%@ page language="java" contentType="text/html; charset=ISO-8859-1" pageEncoding="ISO-8859-1"%>
<!DOCTYPE html>
<html lang="de">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=ISO-8859-1">
<link rel="stylesheet" type="text/css" href="default.css">
<script type="text/javascript" src="./jquery-2.0.3.min.js"></script>
<script type="text/javascript" src="./engine.js"></script>
<title>picsh</title>
</head>
<body>
    <div id="sidebar-menu">

        <div id="upload-section">
            <form id="upload-form" enctype="multipart/form-data" method="POST" action="" onsubmit="tryUploadImage(); return false;">
                <input id="file-input" type="file" name="image-file" />
                <div id="file-drop-zone">
                    <span id="file-drop-text">Datei ausw&auml;hlen/ablegen</span>
                    <div id="file-info-wrapper" style="display: none;">
                        <div id="file-info-preview-wrapper">
                            <img id="file-info-preview" />
                        </div>
                        <span id="file-info-name" class="file-info"></span>
                        <span id="file-info-size" class="file-info"></span>
                    </div>
                </div>
                <input id="file-submit-button" type="submit" value="senden" />
            </form>
        </div>

        <div id="comment-section" style="display: none;">
            <form id="comment-form" enctype="application/x-www-form-urlencoded" method="POST" action="./#/post-comment">
                <label id="comment-name-label">
                    Name:
                    <input id="comment-name-input" type="text" name="name" required="required" />
                </label>
                <label id="comment-email-label">
                    Email:
                    <input id="comment-email-input" type="text" name="email" />
                </label>
                <textarea id="comment-text-input" name="text" required="required"></textarea>
                <input id="comment-submit-button" type="button" value="senden" />
            </form>
        </div>

    </div>

    <div id="thumb-list-section">${ thumbListHtml }</div>
    <div id="scaled-img-overlay" style="display: none;">
        <div id="loading-img"></div>
        <div id="current-scaled-img-wrapper" class="scaled-img-wrapper">
            <img id="current-scaled-img" class="scaled-img" />
        </div>
        <div id="next-scaled-img-wrapper" class="scaled-img-wrapper">
            <img id="next-scaled-img" class="scaled-img" />
        </div>
    </div>

</body>
</html>