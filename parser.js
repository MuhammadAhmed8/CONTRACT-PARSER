var PDFParser = require("pdf2json");
var fs = require('fs');
var identifiers = require("./identifiers");
var text = require("./text")

let reader = () => {


    let pdfPath = "test_pdf_f.pdf"
    let pdfParser = new PDFParser(this,1);

    pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError) );

    pdfParser.on("pdfParser_dataReady", pdfData => {
        let data = pdfParser.getRawTextContent();
        data = text
        toJson(data,identifiers);        
      
        fs.writeFile("test.txt", pdfParser.getRawTextContent(), ()=>{console.log("Done.");});
    });


    pdfParser.loadPDF(pdfPath);

    
  


}

let tokenize = (data) => {

    data = data.replace(/\n/g, " NEWLINE ");
    console.log(data);

    let i = 0;
    let word = "";
    let tokens = [];
    let newWord = false;
    while(i<data.length){
        
        while(data[i] === ' '){
            newWord = true;
            i++;
        }
        if(newWord){  
            tokens.push(word)          
            word = "";
            newWord = false;
        }
        else{
            word += data[i];
            i++;
        }
        
    }
    tokens.push(word)
    return tokens;
}


let toJson = (data, identifiers)=>{
   
    let tokens = tokenize(data);

    let stack = [];
    let rem = "";
    let tree = {root:{'children': []}};
    stack.push(tree['root']);
    let top = stack[0];

    // forming a tree structure of the page
    for(let i=0; i < tokens.length; i++){

        let token = tokens[i];
        let closingTagStart = token.indexOf("</");
        console.log(token, "outer", closingTagStart);
        if(token[0] === '<' && token[1] !== '/'){
            let j = token.indexOf('>');
            let identifier = {...identifiers[token.substring(0,j+1)]};
            if(identifier){
                stack[stack.length-1].children.push({
                    type:"content", 
                    value: rem
                });
                rem = token.substring(j+1);
                identifier['children'] = [];
                stack.push(identifier);
            }

        }
        else if(closingTagStart !== -1 ){
            console.log(token, "inner")
            let closingTagEnd = token.indexOf('>');
            if(closingTagStart < closingTagEnd){
                let tag = token.substring(closingTagStart, closingTagEnd+1);
                rem += token.substring(0,closingTagStart);
                top = stack[stack.length - 1 ];
                top['children'].push({
                    type:"content", 
                    value: rem
                });
                stack.pop();
                stack[stack.length - 1].children.push(top);
                rem = "";
            }

        }
        else{
            rem += token + " ";
        }
    }
    
    // formatting in the specified format.
    let index = 1;
    let response = [];
    for(let child of tree.root.children){
        if(child.type === "content" && (["", "NEWLINE"].includes(child.value.trim()) ) ){
            continue;
        }
        else if(child.type === "section-header"){
            let dataLoadArray = [];
            dataLoadArray.push(child.children[0].value)

            response.push({
                index,
                type: child.type,
                indexName: child.indexNameText + index,
                dataLoadArray
            });

        }
        else if(child.type === "fixed-text-grouped"){

            let variableArray = [];
            let dataLoadArray = [];

            for(let grandChild of child.children){
                
                if(grandChild.type === "content"){
                    dataLoadArray.push(...grandChild.value.split('NEWLINE'))
                }
                else if(grandChild.type === "variable"){
                    variableArray.push({
                        variableType: grandChild.variableType,
                        variableName: grandChild.variableName || grandChild.variableType
                    });
                    dataLoadArray.push(grandChild.children[0].value)
                }
            }
            
            response.push({
                index,
                type: child.type,
                indexName: child.indexNameText + index,
                variableArray,
                dataLoadArray
            });

        }

        index++;

    }

    console.log(tokens);
    console.log(JSON.stringify(tree))
    fs.writeFile("treeStructure.json", JSON.stringify(tree), ()=>{console.log("Done.");});
    fs.writeFile("output.json", JSON.stringify(response), ()=>{console.log("Done.");});

    console.log(identifiers['|*-start-text-group-*|']);
}

(function(){
    reader()
})()

