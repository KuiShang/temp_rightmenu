import java.util.ArrayList;
import java.util.HashMap;


public abstract class Operate {
	public ArrayList<object> arr ;
}
class FileOperate extends Operate{
	 public ArrayList<object> arr  = new ArrayList<object>();
	 public FileOperate(Copy copy, Cut cut) {
		 this.arr.add(cut);
		 this.arr.add(copy);
	 }
}

class Copy{
	void fn(){
		
	}
	
	int rules(){
		return 0;
	}
}
class Cut{
	
}
