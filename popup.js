chrome.tabs.query( {
  active: true,
  lastFocusedWindow: true
},

function(array_of_Tabs) {
  var tab = array_of_Tabs[0];
  //tab.url; - url of the active tab
  chrome.tabs.executeScript(tab.id, {code: "var match = document.getElementsByTagName('pre')[0].innerHTML; chrome.runtime.sendMessage(match);"});  
});


chrome.runtime.onMessage.addListener(function(pageelement) {
  // First, we will turn this into a string (with no escaping of HTML content)
  pagecontent = htmlDecode(pageelement);

  // Find the start of our clinical document
  startIdx = pagecontent.indexOf("ClinicalDocument");
  while ((startIdx > 0) &&
  	  (pagecontent.charAt(startIdx) != "<")) {
      startIdx--;
  }

  // Find the end of our clinical document
  endIdx = pagecontent.lastIndexOf("ClinicalDocument");
  length = pagecontent.length;
  while ((endIdx < length) &&
  	  (pagecontent.charAt(endIdx) != '>')) {
    endIdx++;
  }
  
  // Let's see of we have a document we can use...
  if (startIdx > -1 && endIdx > startIdx) {
  	  doc = pagecontent.substring(startIdx, endIdx+1);
  	  
  	  // Now, we need to turn this back into a DOM
  	  parser = new DOMParser()
  	  doc_dom = parser.parseFromString(doc, "text/xml");
  	  
  	  rendered = transformxml(doc_dom);
  	  document.getElementById("cdaresult").innerHTML = rendered;
  } else {
  	  document.getElementById("cdaresult").innerHTML = "This page doesn't appear to have a CDA document in it!";
  }
});

// Turn a DOM into a string
function htmlDecode(input){
  var e = document.createElement('div');
  e.innerHTML = input;
  return e.childNodes.length === 0 ? "" : e.childNodes[0].nodeValue;
}

// Load our XSL stylesheet from a URL 
function loadXSLtext(url)
{
  xhttp = new XMLHttpRequest();
  xhttp.open("GET", url, false);
  xhttp.send();
  if(xhttp.responseXML == undefined) throw "XHR failed for " + url;
  return xhttp.responseXML;
}

// Do the XSLT transformation and return the result
function transformxml(xml)
{
  var xslUrl = chrome.extension.getURL('nhs_CDA_Document_Renderer.xsl')
  var xsl = loadXSLtext(xslUrl);
  
  var xsltPrs = new XSLTProcessor();
  xsltPrs.importStylesheet(xsl);

  var result = xsltPrs.transformToFragment(xml, document);

  var xmlsrv = new XMLSerializer();
  var plaintext = xmlsrv.serializeToString(result);
  return plaintext;
}