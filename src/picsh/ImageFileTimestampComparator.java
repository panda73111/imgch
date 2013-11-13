package picsh;

import java.io.File;
import java.util.Comparator;


public class ImageFileTimestampComparator implements Comparator<File>
{
	@Override
	public int compare(File arg0, File arg1)
	{
		return (int) (arg1.lastModified() - arg0.lastModified());
	}
}
