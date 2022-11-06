

const FileSystem = function(controller)
{



    this.controller = controller;

    this.files = [];



    this.getFile = function(i)
    {
        return this.files[i];
    }

    this.getFiles = function()
    {
        return this.files;
    }

    this.setFiles = function(arr)
    {
        this.files = arr;
    }

    this.newFile = function()
    {
        
        let newN = 0;

        let exists = false;

        for (let i=0;i<this.files.length;i++)
            if (this.files[i].path === "" && this.files[i].name ==="new.das")
                exists = true;
        while (exists)
        {
            newN +=1;
            let fName = "new("+newN+").das";

            exists = false;
            for (let i=0;i<this.files.length;i++)
                if (this.files[i].path === "" && this.files[i].name ===fName)
                    exists = true;

        }

        this.files.push({
            "path":"",
            "name":"new"+(newN===0 ? "" : "("+newN+")")+".das",
            "text":""
        });
    }

    this.addFile = function(fileDescription)
    {
        this.files.push(fileDescription);
    }

    this.removeFile = function(i)
    {
        this.files.splice(i, 1);
    }

    this.getTreeView = function() 
    {
        
        let entities = [];

        for (let i=0;i<this.files.length;i++)
        {
        let p = this.files[i].path.split('/');



        let currentDir = entities;
        for (let j=0;j<p.length-1;j++)
            {
                

                let found = null;
                for (let k=0;k<currentDir.length;k++)
                    if (currentDir[k].name==p[j])
                    {
                        found = currentDir[k].files;
                    }

                if (found == null)
                {
                    currentDir.push({'name':p[j],'type':'directory','files':[]})

                    found = currentDir[currentDir.length-1].files;
                }
                

                currentDir = found;
            }
        
        currentDir.push({'name':this.files[i].name,'type':'file','index':i})
        }


        let filesTraversal = [];

        let traverse = function(f,depth)
        {
            for (let i=0;i<f.length;i++)
                if (f[i].type=='directory')
                {
                    filesTraversal.push({'name':f[i].name,'type':'directory','depth':depth})
                    traverse(f[i].files,depth+1);
                }
                else if (f[i].type=='file')
                {
                    filesTraversal.push({'name':f[i].name,'type':'file','depth':depth,'index':f[i].index})
                }
        }
        traverse(entities,0);


        return filesTraversal;
    }

}