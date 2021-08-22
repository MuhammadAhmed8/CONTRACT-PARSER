var PDFParser = require("pdf2json");
var fs = require('fs');
const { response } = require("express");
const { listeners } = require("process");

const text = `<hd> 2. OWNERSHIP AND LICENSES</hd>
<text>
:: Work Product Ownership ::
Work Product is <std>My Standard Variable</std> defined as <date>26 September,2021</date>
the finished product, aswell as drafts, notes, materials,
</text>
<text>
mockups,hardware, designs, inventions, patents, code,and anything else that the
Contractor conceives, creates, designs, develops,invents, works on, or reduces to
</text>
<text>
practice—as part of this project, whether before thedate of this Agreement or after.
The Client is deemed to gain full ownership of thework product, including its rights,
titles, and associated interests, once the agreedpayment for it has been made in full
to the Contractor.

:: Background Intellectual Property ::
During the course of this project, the Contractormay choose to use Background
intellectual property that it owns or has licensedfrom a third party, such as
pre-existing code, type fonts, properly-licensed stockphotos, and web application
tools. Any utilized Background IP are considered as <std> Work
Products </std>, and the rights to use them outsidethe defined work product, is
not transferred to the Client.
Where required, the Contractor can choose to grantthe Client the permission to use
and license (with the right to sublicense) the backgroundIP to develop, market, sell,
and support the Client's products and services. TheClient cannot sell or license the
background IP separately from its products or services.This grant does not end
even after this Agreement is ended.
:: Contractor's Right To Use Client IP ::
The Contractor may need to use the Client's intellectualproperty to deliver its work.
The Client agrees to let the Contractor use the Client'sintellectual property and other
intellectual property that the Client controls tothe extent reasonably necessary to do
the Contractor's job. Beyond that, the Client is notobligated to provide the Contractor
any intellectual property rights that are not requiredto deliver the scope of work.
</text>
----------------Page (0) Break----------------
<hd> 3. COMPETITIVE ENGAGEMENTS** </hd>
<text>
The Contractor won't work for a competitor of theClient until this Agreement ends. A
competitor is defined as any third party that develops,manufactures, promotes, sells,
licenses, distributes, or provides products or servicesthat are substantially similar to
the Client's products or services. If the Contractoruses employees or
subcontractors, the Contractor must make sure theyfollow the obligations in this
paragraph, as well.
</text>
----------------Page (1) Break----------------`


let reader = () => {

    let identifiers = {

        "<hd>": {
            closing:"</hd>",
            type: "section-header",
            indexNameText: "sectionHeader",
        },

        "<text>":{
            closing: "</text>",
            type:"fixed-text-grouped",
            indexNameText: "fixedTextGrouped",

        },

        "<std>":{
            closing: "</std>",
            type:"variable",
            variableType:"standard",
        },

        "<stdcp>":{
            closing: "</stdcp>",
            type:"variable",
            variableType:"standard-by-counterparty",
        },

        "<date>":{
            closing: "</date>",
            type:"variable",
            variableType:"standard-date"
        },

        "<datecp>":{
            closing: "</date>",
            type:"variable",
            variableType:"standard-date-by-counterparty"
        },

        "<uxc>": {
            closing: "</uxc>",
            type:"variable",
            variableType: "ux-constructor",
        }

    };


    fs.writeFileSync("test.txt", "FUck");

    let pdfPath = "test_pdf_f.pdf"
    let pdfParser = new PDFParser(this,1);

    pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError) );

    pdfParser.on("pdfParser_dataReady", pdfData => {
        let data = pdfParser.getRawTextContent();
        data = text
        toJson(data,identifiers);        
        // let data = pdfParser.getRawTextContent();
        // console.log(data.split('\r\n'))
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


let s = `Hello Ahmed, How are you
ahmed

heufeh
efne.`
console.log(tokenize(s));

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
    fs.writeFile("test.json", JSON.stringify(tree), ()=>{console.log("Done.");});
    fs.writeFile("test2.json", JSON.stringify(response), ()=>{console.log("Done.");});

    console.log(identifiers['|*-start-text-group-*|']);
}

(function(){
    reader()
})()

