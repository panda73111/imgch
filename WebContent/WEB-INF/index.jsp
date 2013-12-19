<%@ page language="java" contentType="text/html; charset=utf-8" pageEncoding="utf-8"%>
<!DOCTYPE html>
<html lang="de">
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <link rel="stylesheet" type="text/css" href="default.css">
        <script type="text/javascript" src="./jquery-2.0.3.min.js"></script>
        <script type="text/javascript" src="./engine.js"></script>
        <link rel="SHORTCUT ICON" href="Logo.ico" type="image/x-icon">
        <title>Picsh</title>
    </head>
    <body>
        <div id="sidebar-menu">

            <div id="upload-section">
                <form id="upload-form" enctype="multipart/form-data" method="POST" action="./post-image">
                    <div id="file-drop-zone">
                        <input id="file-input" type="file" name="image-file" required="required" />
                        <span id="file-drop-text">Datei ausw&auml;hlen/ablegen</span>
                        <div id="file-info-wrapper" style="display: none;">
                            <div id="file-info-preview-wrapper" style="display: none;">
                                <img id="file-info-preview" />
                            </div>
                            <div id="file-info-loader-wrapper" style="display: none;">
                                <img id="file-info-loader" src="./res/loading.gif" />
                            </div>
                            <span id="file-info-name" class="file-info"></span>
                            <span id="file-info-size" class="file-info"></span>
                            <span id="file-info-status" class="file-info"></span>
                        </div>
                    </div>
                    <input id="file-submit-button" type="submit" value="senden" />
                </form>
            </div>

            <div id="comment-section" style="display: none;">
                <div id="comment-list-wrapper"></div>
                <form id="comment-form" enctype="application/x-www-form-urlencoded" method="POST" action="./post-comment"
                      onsubmit="tryPostComment();
                              return false;">
                    <label id="comment-name-label">
                        <span id="comment-name-label-text" class="comment-label-text">Name:</span>
                        <input id="comment-name-input" type="text" name="name" required="required" maxlength="30" />
                    </label>
                    <label id="comment-email-label">
                        <span id="comment-email-label-text" class="comment-label-text">Email:</span>
                        <input id="comment-email-input" type="email" name="email" maxlength="30" />
                    </label>
                    <textarea id="comment-text-input" name="text" required="required" maxlength="150"></textarea>
                    <input id="comment-imgid-input" name="imgid" type="hidden" />
                    <input id="comment-submit-button" type="submit" value="senden" />
                </form>
            </div>
            <div id="menu-section">
                <a href="./" class="menu-button"> &gt;Home&lt; </a>
                <a href="impressum.html" class="menu-button"> Impressum </a>
                <a href="help.html" class="menu-button"> Hilfe </a>
                <a href="disclamair.html" class="menu-button"> Haftungsausschluss </a>
            </div>

        </div>

        <div id="thumb-list-section">${ thumbListHtml }</div>
        <div id="scaled-img-overlay" style="display: none;">
            <div id="scaled-img-loader"></div>
            <div class="scaled-img-wrapper">
                <img id="current-scaled-img" class="scaled-img" />
            </div>
            <div class="scaled-img-wrapper">
                <img id="next-scaled-img" class="scaled-img" />
            </div>
            <button class="scaled-img-nav-btn" id="scaled-img-nav-btn-left"></button>
            <button class="scaled-img-nav-btn" id="scaled-img-nav-btn-right"></button>
        </div>

    </body>
</html>