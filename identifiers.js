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

module.exports = identifiers;