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

        this.onInit = null;
        this.onPrint = null;

        Module.print = function(text) {

                if (arguments.length > 1)
                    text = Array.prototype.slice.call(arguments).join(' ');

                
                if (this.onPrint)
                    this.onPrint(text);
            }.bind(this);
      

        Module.onRuntimeInitialized = function() {

            this.loaded = true;
            if (this.onInit)
                this.onInit()
    
        }.bind(this)

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




}

