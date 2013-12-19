package picsh;

import java.awt.image.BufferedImage;
import java.io.*;
import java.net.HttpURLConnection;
import java.util.*;

import javax.imageio.ImageIO;
import javax.servlet.*;
import javax.servlet.http.*;
import javax.servlet.annotation.WebServlet;

import org.apache.commons.fileupload.*;
import org.apache.commons.fileupload.disk.DiskFileItemFactory;
import org.apache.commons.fileupload.servlet.ServletFileUpload;
import org.apache.commons.lang3.StringEscapeUtils;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;


@SuppressWarnings("serial")
@WebServlet(name = "picsh", urlPatterns = { "/index", "/post-image", "/post-comment", "/get-comments" })
public class PicshServlet extends HttpServlet
{
    private SortedSet<File>                      imgList;
    private ServletContext                       context;
    private String                               fullSizeDirPath;
    private String                               thumbDirPath;
    private int                                  nextFreeImgId;
    private ThumbnailGenerator                   thumbGen;
    private HashMap<Integer, List<ImageComment>> comments;

    private static final int                     maxImgByteSize     = 5 * 1024 * 1024;
    private static final HashSet<String>         allowedImgTypes    = new HashSet<String>(Arrays.asList(new String[] {
            "png", "gif", "jpg", "jpeg"                            }));
    private static final int                     thumbWidth         = 128;
    private static final int                     thumbHeight        = 128;
    private static final String                  thumbImgType       = "jpg";
    private static final int                     maxCommentNameLen  = 30;
    private static final int                     maxCommentEmailLen = 30;
    private static final int                     maxCommentTextLen  = 150;
    private static final String                  commentsDbFileName = "comments.dat";

    @Override
    public void init() throws ServletException
    {
        super.init();

        context = getServletContext();
        fullSizeDirPath = context.getRealPath("/img");
        thumbDirPath = context.getRealPath("/thumb");
        nextFreeImgId = getUnusedImgId(0);
        thumbGen = new ThumbnailGenerator(thumbWidth, thumbHeight);

        File thumbDir = new File(thumbDirPath);
        if (!thumbDir.exists())
            thumbDir.mkdir();
        File fullSizeDir = new File(fullSizeDirPath);
        if (!fullSizeDir.exists())
            fullSizeDir.mkdir();

        ImgFileFilter imgFilter = new ImgFileFilter(allowedImgTypes);

        // imgList contains image files in fullSizeDir,
        // ordered after time of last modification, newest first
        imgList = new TreeSet<File>(new ImageFileTimestampComparator());
        imgList.addAll(Arrays.asList(fullSizeDir.listFiles(imgFilter)));

        try
        {
            comments = loadComments();
        }
        catch (IOException | ClassNotFoundException e)
        {
            comments = new HashMap<Integer, List<ImageComment>>();
        }
    }

    private HashMap<Integer, List<ImageComment>> loadComments() throws IOException, ClassNotFoundException
    {
        File commentDbFile = new File(context.getRealPath("/"), commentsDbFileName);

        FileInputStream fInStr = new FileInputStream(commentDbFile);
        ObjectInputStream objStr = new ObjectInputStream(fInStr);

        HashMap<Integer, List<ImageComment>> comments = (HashMap<Integer, List<ImageComment>>) objStr.readObject();
        objStr.close();

        return comments;
    }

    private void saveComments() throws IOException, ClassNotFoundException
    {
        File commentDbFile = new File(context.getRealPath("/"), commentsDbFileName);

        FileOutputStream fInStr = new FileOutputStream(commentDbFile);
        ObjectOutputStream objStr = new ObjectOutputStream(fInStr);

        objStr.writeObject(comments);
        objStr.close();
    }

    private int getUnusedImgId(int prevId)
    {
        int id = prevId;
        while (new File(thumbDirPath, Integer.toString(id) + '.' + thumbImgType).exists())
            id++;
        return id;
    }

    private String getCommentListJson(int imgId) throws IllegalArgumentException
    {
        List<ImageComment> commentList = comments.get(imgId);

        if (commentList == null)
            throw new IllegalArgumentException("imgId");

        Gson gson = new Gson();
        return gson.toJson(commentList);
    }

    private String getThumbListHtml()
    {
        StringBuilder ret = new StringBuilder();

        for (File thumb : imgList)
        {
            String imgName = thumb.getName();
            String imgBaseName = imgName.substring(0, imgName.lastIndexOf('.'));
            String imgId = imgName.substring(0, imgName.lastIndexOf('.'));
            ret.append(String.format("<div class=\"thumb-wrapper\" id=\"thumb-%s\" imgid=\"%s\">", imgId, imgId));
            ret.append(String.format("<a class=\"thumb-link\" href=\"./#/fullsize/%s\">", imgName));
            ret.append(String.format("<img class=\"thumb\" src=\"thumb/%s.%s\" />", imgBaseName, thumbImgType));
            ret.append("</a></div>\n");
        }

        return ret.toString();
    }

    private void saveThumbnail(BufferedImage source, String baseName) throws IOException
    {
        File thumbFile = new File(thumbDirPath, baseName + '.' + thumbImgType);
        BufferedImage thumb = thumbGen.getThumbnail(source);
        ImageIO.write(thumb, thumbImgType, thumbFile);
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

            // the input stream cannot be read from again, use the buffer
            // instead
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
            return FileUploadStatus.INVALID_REQUEST;
        }
    }

    private PostCommentStatus postComment(HttpServletRequest request)
    {
        try
        {
            String name = request.getParameter("name");
            String email = request.getParameter("email");
            String text = request.getParameter("text");
            int imgId = Integer.parseInt(request.getParameter("imgid"));

            if (email == null)
                email = "";

            if (name == null || name.length() == 0 || name.length() > maxCommentNameLen || text == null
                    || text.length() == 0 || text.length() > maxCommentTextLen)
                return PostCommentStatus.INVALID_REQUEST;
            
            name = StringEscapeUtils.escapeHtml4(name);
            email = StringEscapeUtils.escapeHtml4(email);
            text = StringEscapeUtils.escapeHtml4(text);

            if (comments.get(imgId) == null)
                comments.put(imgId, new ArrayList<ImageComment>());

            comments.get(imgId).add(new ImageComment(name, email, text, new Date().getTime()));

            saveComments();
            return PostCommentStatus.OK;
        }
        catch (NumberFormatException e)
        {
            return PostCommentStatus.INVALID_REQUEST;
        }
        catch (IOException | ClassNotFoundException e)
        {
            System.out.println(e);
            return PostCommentStatus.SERVER_ERROR;
        }
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException
    {
        PrintWriter wr;
        String reqUri = req.getRequestURI();
        String cmd = reqUri.substring(reqUri.lastIndexOf('/') + 1);

        switch (cmd)
        {
            case "get-comments":

                resp.setContentType("text/plain");
                wr = resp.getWriter();
                
                try
                {
                    int imgId = Integer.parseInt(req.getParameter("imgid"));
                    wr.print(getCommentListJson(imgId));
                }
                catch (IllegalArgumentException e)
                {
                    wr.print("[]");
                }
                
                wr.flush();
                wr.close();
                break;

            default:

                String thumbListHtml = getThumbListHtml();
                req.setAttribute("thumbListHtml", thumbListHtml);
                req.getRequestDispatcher("/WEB-INF/index.jsp").forward(req, resp);
                break;
        }

    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException
    {
        PrintWriter wr;
        String reqUri = req.getRequestURI();
        String cmd = reqUri.substring(reqUri.lastIndexOf('/') + 1);

        switch (cmd)
        {
            case "post-image":

                resp.setContentType("text/plain");
                wr = resp.getWriter();
                wr.print(uploadImage(req));
                wr.flush();
                wr.close();
                break;

            case "post-comment":

                resp.setContentType("text/plain");
                wr = resp.getWriter();
                wr.print(postComment(req));
                wr.flush();
                wr.close();
                break;

            default:

                resp.sendError(HttpURLConnection.HTTP_BAD_REQUEST);
                break;
        }
    }

}
