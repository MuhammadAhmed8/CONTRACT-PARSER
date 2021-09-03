var fs = require('fs');
var identifiers = require("./identifiers");
var text = require("./text")
const pdf = require('pdf-parse');

let reader = () => {


    let pdfPath = "input.pdf"
    let dataBuffer = fs.readFileSync(pdfPath);

    pdf(dataBuffer).then(function(data) {
        
        let {docStructure, result} = toJson(data.text,identifiers);       

        fs.writeFile("output.json", JSON.stringify(result), ()=>{console.log("Done.");});
        fs.writeFile("docStructure.json", JSON.stringify(docStructure), ()=>{});

            
    });
    

    
}

String.prototype.toProperCase = function () {
    return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};

String.prototype.toCamelCase = function () {
    return this.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function(match, index) {
        if (+match === 0) return "";
        return index === 0 ? match.toLowerCase() : match.toUpperCase();
    });
};

let tokenize = (data) => {

    data = data.replace(/\n/g, " NEWLINE ");
    
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
    console.log(tokens)
    return tokens;
}


let toJson = (data, identifiers)=>{
   
    try{
        let tokens = tokenize(data);

        let stack = [];
        let rem = "";
        var tree = {root:{'children': []}};
        stack.push(tree['root']);
        let top = stack[0];

        // forming a tree structure of the page
        for(let i=0; i < tokens.length; i++){

            let token = tokens[i];
            let closingTagStart = token.indexOf("</");
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
        let indexId = 1;
        var response = [];
        for(let child of tree.root.children){
            
            if(child.type === "content" && child.value.split("NEWLINE").length > 2){
                response.push({
                    indexId,
                    type: 'format-break',
                    indexName: 'break'
                });
                indexId++;
            }
            else if(child.type === "content" && (["", "NEWLINE"].includes(child.value.trim()) ) ){
                continue;
            }
            else if(child.type === "section-header"){
                let dataLoad = child.children[0].value;

                response.push({
                    indexId,
                    type: child.type,
                    indexName: child.indexNameText + indexId,
                    dataLoad
                });

                indexId++;

            }
            else if(child.type === "fixed-text-grouped"){

                let variableArray = [];
                let dataLoadArray = [];

                for(let grandChild of child.children){
                    if(grandChild.type === "content"){
                        let newTemp = [];
                        grandChild.value.split('NEWLINE').forEach((elem)=>{
                            if(elem === ""){
                                return;
                            }
                            else if(elem === " "){
                                newTemp[newTemp.length - 1] = "|*-format-break-*|" ;
                            }
                            else{
                                newTemp.push(elem.trim());
                                newTemp.push("|*-next-line-*|")
                            }
                        });

                        dataLoadArray.push(...newTemp);

                    }
                    else if(grandChild.type === "variable"){
                        grandChild.children[0].value = grandChild.children[0].value.replace('NEWLINE','').trim();
                        variableArray.push({
                            variableType: grandChild.variableType,
                            variableName: grandChild.children[0].value.toProperCase(),
                            variableDisplayName: grandChild.children[0].value.toCamelCase()
                        });
                        dataLoadArray.push("|*-variable-*|")
                    }
                }
                
                response.push({
                    indexId,
                    type: child.type,
                    indexName: child.indexNameText + indexId,
                    variableArray,
                    dataLoadArray
                });
                indexId++;

            }

           

        }

        return {
            docStructure: tree,
            result: {
                "agreementCustomFields": {"":""},
                "counterpartyInputFields": {"":""},
                "tldrModeAvailable":false,
                "hasToSignAsOrganization":false,
                "counterpartyHasToSignAsOrganization":false,
                "counterpartyInputRequired":false,
                "creatorPartyLabel":"",
                "counterPartyLabel":"",
                "agreementTextContent": response
            }
        }
    }
    catch(err){
        console.log(err)
    }
   
   
}

(function(){
    reader()
})()

