package picsh;

import java.io.Serializable;
import java.util.Date;

public class ImageComment implements Serializable
{
    private static final long serialVersionUID = -6472258360363731660L;
    public final String name;
    public final String email;
    public final String text;
    public final long timestamp;

    public ImageComment(String name, String email, String text, long timestamp)
    {
        this.name = name;
        this.email = email;
        this.text = text;
        this.timestamp = timestamp;
    }
}
