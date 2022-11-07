

class FileSystem
{


    constructor()
    {


        this.files = [];


        this.selector = {};
    
    }

    addSelector(name)
    {
        this.selector[name] = 0;
    }

    setSelector(name,file)
    {
        this.selector[name] = null;
        if (file)
            for (let i=0;i<this.files.length;i++)
                if (this.files[i]===file)
                {

                    this.selector[name] = i;
                    return;
                }
    }

    getFile(selectorName)
    {
        return this.files[this.selector[selectorName]];
    }

    getFiles()
    {
        return this.files;
    }

    setFiles(arr)
    {
        this.files = arr;
    }

    newFile()
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

    addFile(fileDescription)
    {
        this.files.push(fileDescription);
    }

    removeFile(selectorName)
    {
        this.files.splice(this.selector[selectorName], 1);

        
        if (this.selector[selectorName]>=this.files.length)
            this.selector[selectorName] = this.files.length-1;
    }

    getTreeView() 
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
        
        currentDir.push({'name':this.files[i].name,'type':'file','file':this.files[i]})
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
                    filesTraversal.push({'name':f[i].name,'type':'file','depth':depth,'file':f[i].file})
                }
        }
        traverse(entities,0);


        return filesTraversal;
    }

}