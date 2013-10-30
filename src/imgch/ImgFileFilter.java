package imgch;

import java.io.File;
import java.io.FileFilter;
import java.util.Set;
import java.util.HashSet;
import java.util.Arrays;

public class ImgFileFilter implements FileFilter
{
	private static final Set<String> allowedExts = new HashSet<String>(Arrays.asList(new String[] { "jpg", "jpeg",
			"png", "gif", "bmp" }));

	public ImgFileFilter()
	{
	}

	@Override
	public boolean accept(File pathname)
	{
		String path = pathname.getPath();

		if (pathname.isDirectory() || !path.contains("."))
			return false;

		String ext = path.substring(path.lastIndexOf('.') + 1);

		return allowedExts.contains(ext); // O(1)
	}

}
