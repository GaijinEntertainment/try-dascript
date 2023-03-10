var Module = {
    noInitialRun : [],
    preRun: [],
    postRun: [],
    onRuntimeInitialized: null,
    print: null,
}





class RuntimeController
{
    constructor()
    {
        this.loaded = false;
        this.aborted = false;

        this.onInit = null;
        this.onAbort = null;
        this.onPrintLine = null;
        this.onPrintChar = null;

        
        this.printByChar = true;
        
        Module.print = [
            function(char) {
                if (this.onPrintChar && this.printByChar)
                    this.onPrintChar(char);
            }.bind(this),

            function(line) {
                if (this.onPrintLine && !this.printByChar)
                    this.onPrintLine(line);
            }.bind(this)
        ]

      

        Module.onRuntimeInitialized = function() {

            
            // print hack
            this.fixTTY();

            this.loaded = true;
            if (this.onInit)
                this.onInit()
                
    
        }.bind(this)

        Module.onAbort = function() {
            this.aborted = true;
            if (this.onAbort)
                this.onAbort()

        }.bind(this)

    }

    isLoaded()
    {
        return this.loaded;
    }

    fixTTY()
    {
        
        TTY.default_tty_ops.put_char = function(tty, val) {

            out[0](String.fromCharCode(val))
        
            if (val === null || val === 10) {
                out[1](UTF8ArrayToString(tty.output, 0));
                tty.output = []
            } else {
                if (val != 0)
                    tty.output.push(val)
            }
        }

    }


    setFS(fileSystem)
    {
        
        let files = fileSystem.getFiles();

        for (let i=0;i<files.length;i++)
        {


            if (files[i].path !== "")
            {

                let folders = files[i].path.split("/");
                let paths = [folders[0]+"/"];
                for (let j=1;j<folders.length;j++)
                    paths.push(paths[j-1] + folders[j]+"/")

                for (let j=0;j<paths.length;j++)

                    if (!FS.analyzePath(paths[j]).exists)
                        FS.mkdir(paths[j]);
            }

            FS.writeFile(files[i].path+files[i].name, files[i].text);
        }

    }

    run(mainPath,mainFunc,onComplete)
    {

        callMain([mainPath,"-main",mainFunc]);

        if (onComplete)
            onComplete();
    }


    restartEnvironment()
    {

        //small hack
        calledRun = undefined;
        

        let src = './daScript.js';
        
        document.querySelector('script[src="' + src + '"]').remove();

        let script = document.createElement('script');
        script.src = src;
        script.type = "text/javascript"
        document.body.appendChild(script);

    
    }





}

