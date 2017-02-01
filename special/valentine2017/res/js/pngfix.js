/*
 
Correctly handle PNG transparency in Win IE 5.5 & 6.
http://homepage.ntlworld.com/bobosola. Updated 18-Jan-2006.

Use in <head> with DEFER keyword wrapped in conditional comments:
<!--[if lt IE 7]>
<script defer type="text/javascript" src="pngfix.js"></script>
<![endif]-->

*/

var arVersion = navigator.appVersion.split("MSIE")
var version = parseFloat(arVersion[1])
var re = /^agwpg/i;
var workAroundIEDeadlockBug = re.exec( document.location ) == null;

if ((version >= 5.5) && (document.body.filters) && workAroundIEDeadlockBug) {
   for(var i=0; i<document.images.length; i++)="" {="" var="" img="document.images[i]" imgname="img.src.toUpperCase()" if="" (imgname.substring(imgname.length-3,="" imgname.length)="=" "png")="" imgid="(img.id)" ?="" "id="" + img.id + "" "="" :="" ""="" imgclass="(img.className)" "class="" + img.className + "" imgtitle="(img.title)" "title="" + img.title + "" imgstyle="display:inline-block;" +="" img.style.csstext="" (img.align="=" "left")="" "right")="" (img.parentelement.href)="" strnewhtml="<span " style="\""" "width:"="" img.width="" "px;="" height:"="" img.height="" "px;"="" ";"="" "filter:progid:dximagetransform.microsoft.alphaimageloader"="" "(src="\'"" img.src="" "\',="" sizingmethod="scale" );\"="">" 
         img.outerHTML = strNewHTML
         i = i-1
      }
   }
}
</document.images.length;></head>