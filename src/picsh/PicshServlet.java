package picsh;

import java.awt.*;
import java.awt.geom.AffineTransform;
import java.awt.geom.Point2D;
import java.awt.image.BufferedImage;
import java.io.*;
import java.util.*;
import java.util.List;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.FileImageOutputStream;
import javax.servlet.*;
import javax.servlet.http.*;
import javax.servlet.annotation.WebServlet;

import org.apache.commons.fileupload.*;
import org.apache.commons.fileupload.disk.DiskFileItemFactory;
import org.apache.commons.fileupload.servlet.ServletFileUpload;

@WebServlet(name = "picsh", urlPatterns = "/index")
public class PicshServlet extends HttpServlet
{
	private SortedSet<File> imgList;
	private ServletContext context;
	private String fullSizeDirPath;
	private String thumbDirPath;
	private int nextFreeImgId;

	private static final int maxImgByteSize = 5 * 1024 * 1024;
	private static final HashSet<String> allowedImgTypes = new HashSet<String>(Arrays.asList(new String[] { "png",
			"gif", "jpg", "jpeg" }));
	private static final int thumbWidth = 128;
	private static final int thumbHeight = 128;
	private static final String thumbImgType = "jpg";

	@Override
	public void init() throws ServletException
	{
		super.init();

		context = getServletContext();
		fullSizeDirPath = context.getRealPath("/img");
		thumbDirPath = context.getRealPath("/thumb");
		nextFreeImgId = getUnusedImgId(0);

		File thumbDir = new File(thumbDirPath);
		ImgFileFilter imgFilter = new ImgFileFilter(allowedImgTypes);

		// imgList contains image files in fullSizeDir,
		// ordered after time of last modification, newest first
		imgList = new TreeSet<File>(new ImageFileTimestampComparator());
		imgList.addAll(Arrays.asList(thumbDir.listFiles(imgFilter)));
	}

	private int getUnusedImgId(int prevId)
	{
		int id = prevId;
		while (new File(thumbDirPath, Integer.toString(id) + '.' + thumbImgType).exists())
			id++;
		return id;
	}

	private String getThumbListHtml()
	{
		StringBuilder ret = new StringBuilder();

		for (File thumb : imgList)
		{
			String imgName = thumb.getName();
			String imgBaseName = imgName.substring(0, imgName.lastIndexOf('.'));
			String imgId = imgName.substring(0, imgName.lastIndexOf('.'));
			ret.append(String.format("<div class=\"thumb-wrapper\" id=\"thumb-%s\">", imgId));
			ret.append(String.format("<a class=\"thumb-link\" href=\"./#/fullsize/%s\">", imgName));
			ret.append(String.format("<img class=\"thumb\" src=\"thumb/%s.%s\" />", imgBaseName, thumbImgType));
			ret.append("</a></div>\n");
		}

		return ret.toString();
	}

	private BufferedImage scaleImageDown(BufferedImage source)
	{
		// crop the image to fit thumbnail size and keep the aspect ratio
		BufferedImage bi = new BufferedImage(thumbWidth, thumbHeight, BufferedImage.SCALE_SMOOTH);
		Graphics2D g2d = bi.createGraphics();
		double xScale = (double) thumbWidth / source.getWidth();
		double yScale = (double) thumbHeight / source.getHeight();
		AffineTransform at;
		if (source.getWidth() > source.getHeight())
		{
			// landscape orientation
			xScale = yScale;
			at = AffineTransform.getScaleInstance(xScale, yScale);
			at.translate(0.5, 1); // centering
		}
		else
		{
			// portrait orientation
			yScale = xScale;
			at = AffineTransform.getScaleInstance(xScale, yScale);
			at.translate(1, 0.5); // centering
		}

		g2d.drawRenderedImage(source, at);
		g2d.dispose();
		return bi;
	}

	private void saveThumbnail(BufferedImage source, String baseName) throws IOException
	{
		File thumbFile = new File(thumbDirPath, baseName + '.' + thumbImgType);
		ImageIO.write(scaleImageDown(source), thumbImgType, thumbFile);
	}

	private FileUploadStatus uploadImage(HttpServletRequest request)
	{
		if (!ServletFileUpload.isMultipartContent(request))
			return FileUploadStatus.INVALID_REQUEST;

		FileItemFactory factory = new DiskFileItemFactory();
		ServletFileUpload upload = new ServletFileUpload(factory);

		try
		{
			List<FileItem> uploadItems = upload.parseRequest(request);
			if (uploadItems.size() < 1)
				return FileUploadStatus.NO_FILE;

			FileItem inFileItem = uploadItems.get(0);

			if (inFileItem.getSize() > maxImgByteSize)
				return FileUploadStatus.FILE_TOO_LARGE;

			String initFileName = inFileItem.getName();
			String initFileType = initFileName.substring(initFileName.lastIndexOf('.') + 1).toLowerCase();

			if (!allowedImgTypes.contains(initFileType))
				return FileUploadStatus.DISSALLOWED_FILE_TYPE;

			String imgIdString = Integer.toString(nextFreeImgId);
			String newFileName = imgIdString + '.' + initFileType;

			File outFile = new File(fullSizeDirPath, newFileName);

			InputStream inStr = inFileItem.getInputStream();

			byte[] buffer = new byte[maxImgByteSize];
			int bytesRead = 0, totalBytesRead = 0;

			do
			{
				totalBytesRead += bytesRead;
				bytesRead = inStr.read(buffer, totalBytesRead, maxImgByteSize - totalBytesRead);
			}
			while (bytesRead != -1);

			FileOutputStream outStr = new FileOutputStream(outFile);
			outStr.write(buffer, 0, totalBytesRead);
			outStr.flush();
			outStr.close();
			
			// the input stream cannot be read from again, use the buffer instead
			BufferedImage bi = ImageIO.read(new ByteArrayInputStream(buffer, 0, totalBytesRead));
			saveThumbnail(bi, imgIdString);

			nextFreeImgId = getUnusedImgId(nextFreeImgId);

			imgList.add(outFile);
			return FileUploadStatus.OK;
		}
		catch (IOException ex)
		{
			return FileUploadStatus.SERVER_ERROR;
		}
		catch (FileUploadException ex)
		{
			System.out.println(ex);
			return FileUploadStatus.INVALID_REQUEST;
		}
	}

	@Override
	protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException
	{
		String thumbListHtml = getThumbListHtml();
		req.setAttribute("thumbListHtml", thumbListHtml);
		req.getRequestDispatcher("/WEB-INF/index.jsp").forward(req, resp);
	}

	@Override
	protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException
	{
		resp.setContentType("text/plain");
		PrintWriter wr = resp.getWriter();
		wr.println(uploadImage(req));
		wr.flush();
		wr.close();
	}

}
