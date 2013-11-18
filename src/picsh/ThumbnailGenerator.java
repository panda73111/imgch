package picsh;

import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.geom.AffineTransform;
import java.awt.image.BufferedImage;

public class ThumbnailGenerator
{
	private int thumbWidth, thumbHeight;

	public ThumbnailGenerator(int width, int height)
	{
		thumbWidth = width;
		thumbHeight = height;
	}

	public BufferedImage getThumbnail(BufferedImage source)
	{
		// crop the image to fit the thumbnail size and keep the aspect ratio

		int srcWidth = source.getWidth();
		int srcHeight = source.getHeight();

		// don't zoom images smaller than thumbnail size
		int scaledWidth, scaledHeight;
		int cutThumbWidth, cutThumbHeight;
		double scale;
		int translX, translY;

		if (srcWidth > srcHeight)
		{
			// landscape, cut the width and fit the height inside the thumbnail
			scaledHeight = (int) Math.min(thumbHeight, srcHeight);
			scale = Math.min(1.0d, (double) scaledHeight / srcHeight);
			scaledWidth = (int) (srcWidth * scale);

			if (scaledWidth > thumbWidth)
				translX = (scaledWidth - thumbWidth) / -2;
			else
				translX = 0;
			translY = 0;

			cutThumbWidth = (int) Math.min(thumbWidth, scaledWidth);
			cutThumbHeight = scaledHeight;
		}
		else
		{
			// portrait, cut the height and fit the width inside the thumbnail
			scaledWidth = (int) Math.min(thumbWidth, srcWidth);
			scale = Math.min(1.0d, (double) scaledWidth / srcWidth);
			scaledHeight = (int) (srcHeight * scale);

			translX = 0;
			if (scaledHeight > thumbHeight)
				translY = (scaledHeight / 2 - thumbHeight / 2) * -1;
			else
				translY = 0;

			cutThumbWidth = scaledWidth;
			cutThumbHeight = (int) Math.min(thumbHeight, scaledHeight);
		}

		AffineTransform transf = new AffineTransform();

		// centering
		transf.translate(translX, translY);
		// scaling
		transf.scale(scale, scale);

		BufferedImage thumb = new BufferedImage(cutThumbWidth, cutThumbHeight, BufferedImage.TYPE_INT_RGB);
		Graphics2D graph = (Graphics2D) thumb.getGraphics();

		// fast interpolation
		graph.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_NEAREST_NEIGHBOR);
		graph.drawImage(source, transf, null);
		graph.dispose();

		return thumb;
	}
}
