var editor;

var runtimeLoaded = false;



window.addEventListener("load",function() {

    editor = new Editor();

}.bind(this))



var Module = {
        noInitialRun : [],
        preRun: [],
        postRun: [],
        onRuntimeInitialized: function() {
            runtimeLoaded = true;
            if (editor)
                editor.setPageStatus("Runtime Ready","#000000")

        }.bind(this),
        print: (function() {
            return function(text) {
                if (arguments.length > 1)
                    text = Array.prototype.slice.call(arguments).join(' ');

                editor.outputView.print(text,'#ffffff');

                editor.outputPool.push(text);
            };
        })(),
    }






