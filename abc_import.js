//=============================================================================
//  MuseScore
//  Linux Music Score Editor
//  $Id:$
//
//  Abc 2 xml calls a webservice at http://abc2xml.appspot.com to convert
//  an abc tune to MusicXML and open it with MuseScore for further editing
//
//  Copyright (C)2008 Werner Schweer and others
//
//  This program is free software; you can redistribute it and/or modify
//  it under the terms of the GNU General Public License version 2.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program; if not, write to the Free Software
//  Foundation, Inc., 675 Mass Ave, Cambridge, MA 02139, USA.
//=============================================================================

//
// This is ECMAScript code (ECMA-262 aka "Java Script")
//

//
// This Plugin is based on ABC Import.
//



//---------------------------------------------------------
//    init
//    this function will be called on startup of mscore
//---------------------------------------------------------

function init()
      {
      // print("test script init");
      }

//-------------------------------------------------------------------
//    run
//    this function will be called when activating the
//    plugin menu entry
//
//    global Variables:
//    pluginPath - contains the plugin path; file separator is "/"
//-------------------------------------------------------------------

var form;
var outFile;
var reqId;
var defaultOpenDir = QDir.homePath();
var http;

function run()
      {
      var loader = new QUiLoader(null);
		  var file   = new QFile(pluginPath + "/abc_import.ui");
		  file.open(QIODevice.OpenMode(QIODevice.ReadOnly, QIODevice.Text));
		  form = loader.load(file, null);
		  form.buttonBox.accepted.connect(accept);
		  form.bLoad.clicked.connect(loadFile);
		  form.exec();
      }


function loadFile()
	{
		var filename = QFileDialog.getOpenFileName(this, "MuseScore: Load ABC File", defaultOpenDir, "ABC file (*.abc)");
		if(filename){
		  //read abc file
		  var file = new QFile(filename);
		  var line;
		  if ( file.open(QIODevice.ReadOnly) ) {       
			  // file opened successfully
			  var t = new QTextStream( file ); // use a text stream
			  var content ="";
			  
			  do {
				line = t.readLine(); // line of text excluding '\n'
				// do something with the line
				content +=line; 
				content +='\n';    // add the missing '\n'
			  } while (line);        
			  // Close the file
			  file.close();
			  //print (content);
			  form.abcTune.setPlainText(content);
		  }
		}
	}

//---------------------------------------------------------
// Converts the pasted ABC tune
//---------------------------------------------------------
function accept()
    {
		var content = form.abcTune.plainText;

		//print(content);
		

		//encode file content for url
		var encodedContent = QUrl.toPercentEncoding(content).toString();

		//print(encodedContent);

		var url = "/abcrenderer";
		encodedContent = "content=" + encodedContent;
		
		var content = new QByteArray();
    content.append(encodedContent);
    
    var contentLength = content.length();
    var buffer = new QBuffer(content);
		
		//call the webservice and save to temporary file        
		outFile = new QTemporaryFile(QDir.tempPath()+"/abc_XXXXXX.xml");
		outFile.open();
		http = new QHttp();
		http.setHost("abc2xml.appspot.com", 80);
		http.requestFinished.connect(outFile,finished);
		reqId = http.post(url, buffer, outFile);
    }


//---------------------------------------------------------
// display a message box with error message
//---------------------------------------------------------
function errorMessage(){
      mb = new QMessageBox();
      mb.setWindowTitle("Error: abc2xml conversion");
      mb.text = "An error ("+ http.error() + ") occured during the conversion.<br />Try it manually at: <a href=\"http://abc2xml.appspot.com\">http://abc2xml.appspot.com</a>";
      mb.exec();
}

//---------------------------------------------------------
// get finished handler
//---------------------------------------------------------
function finished(id ,error){
  print("finished");
  print(id);
  if (error){
    errorMessage();
    outFile.close();
    return;
  }
  if (id == reqId){
    outFile.flush();
    outFile.close();
    if(http.error() != 0) {
        errorMessage();
        outFile.close();
        return;
    }
    if(outFile.size() > 200){
      var score   = new Score();
      score.load(outFile.fileName());    
    }else{
      errorMessage();
    }  
  }
}

QByteArray.prototype.toString = function()
{
   ts = new QTextStream( this, QIODevice.ReadOnly );
   return ts.readAll();
}

//---------------------------------------------------------
//    menu:  defines were the function will be placed
//           in the MuseScore menu structure
//---------------------------------------------------------

var mscorePlugin = {
      menu: 'Plugins.ABC Import',
      init: init,
      run:  run
      };

mscorePlugin;

