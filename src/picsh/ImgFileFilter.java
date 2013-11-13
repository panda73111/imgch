package picsh;

import java.io.File;
import java.io.FileFilter;
import java.util.Set;
import java.util.HashSet;
import java.util.Arrays;

public class ImgFileFilter implements FileFilter
{
	private Set<String> allowedExts;

	public ImgFileFilter(String[] extensions)
	{
		allowedExts = new HashSet<String>(Arrays.asList(extensions));
	}

	public ImgFileFilter(String extension)
	{
		allowedExts = new HashSet<String>(Arrays.asList(extension));
	}
	
	public ImgFileFilter(HashSet<String> extensions)
	{
		allowedExts = extensions;
	}
	
	@Override
	public boolean accept(File path)
	{
		if (!path.isFile())
			return false;
		
		String pathString = path.getPath();
		
		int dotI = pathString.lastIndexOf('.');
		if (dotI <= 0)
			return false;

		String ext = pathString.substring(dotI + 1);

		return allowedExts.contains(ext); // O(1)
	}

}
