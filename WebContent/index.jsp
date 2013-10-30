<%@page import="java.util.Arrays"%>
<%@page import="imgch.ImgFileFilter"%>
<%@page import="java.io.File"%>
<%@ page language="java" contentType="text/html; charset=ISO-8859-1"
	pageEncoding="ISO-8859-1"%>
<%!HttpServletRequest req;
	File[] thumbList;%>
<%
	req = request;

	File jsp = new File(req.getSession().getServletContext().getRealPath(req.getServletPath()));
	File workDir = jsp.getParentFile();
	File thumbDir = new File(workDir, "/thumb");

	ImgFileFilter imgFilter = new ImgFileFilter();
	thumbList = thumbDir.listFiles(imgFilter);
%>
<%!private String getThumbList()
	{
		StringBuilder ret = new StringBuilder();

		for (File thumb : thumbList)
		{
			String imgName = thumb.getName();
			String imgId = imgName.substring(0, imgName.lastIndexOf('.'));
			ret.append(String.format("<div class=\"thumb-wrapper\" id=\"thumb-%s\">", imgId));
			ret.append(String.format("<a class=\"thumb-link\" href=\"./#/fullsize/%s\">", imgName));
			ret.append(String.format("<img class=\"thumb\" src=\"thumb/%s\" />", imgName));
			ret.append("</a></div>");
		}

		return ret.toString();
	}%>
<!DOCTYPE html>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=ISO-8859-1">
<link rel="stylesheet" type="text/css" href="default.css">
<script type="text/javascript" src="jquery-2.0.3.min.js"></script>
<script type="text/javascript" src="engine.js"></script>
<title>imgch</title>
</head>
<body>

	<div id="thumb-list-section">
		<%
			out.print(getThumbList());
		%>
	</div>
	<div id="fullsize-overlay" style="display: none; opacity: 0;">
		<div id="comment-section">
			<form id="comment-form">
				<label id="comment-name-label">Name:<input
					id="comment-name-input" type="text" name="name" /></label> <label
					id="comment-email-label">Email:<input
					id="comment-email-input" type="text" name="email" /></label>
				<textarea id="comment-text-input" name="text"></textarea>
				<input id="comment-post-button" type="button" value="senden" />
			</form>
		</div>
		<div id="fullsize-wrapper">
			<img id="fullsize-img" />
		</div>
	</div>

</body>
</html>