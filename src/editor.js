
class Editor {

    constructor(runtimeController)
    {
        this.runtimeController = runtimeController;

        this.fileSystem = new FileSystem();
        this.fileView = new FileView(this);
        this.browserView = new BrowserView(this);
        this.outputView = new OutputView(this);


        this.statusDiv = document.getElementById("main_status");



        this.mainColPos = [2.03/10,6/10];
        this.mainColVisible = [false,true,true];

        this.separatorDiv = [];
        this.mainColumnDiv = [];
        this.mainColumnNum = 3;

        this.mainColumnOpenedDiv = [];
        this.mainColumnHiddenDiv = [];

        this.selectedSeparator = -1;

        for (let i=0;i<this.mainColumnNum;i++)
        {
            let mc = document.getElementById("main_col"+(i+1));
            this.mainColumnDiv.push(mc);


            let mco = mc.getElementsByClassName("main_col_opened")[0];
            this.mainColumnOpenedDiv.push(mco);

            let mch = mc.getElementsByClassName("main_col_hidden")[0];
            this.mainColumnHiddenDiv.push(mch);

            mc.getElementsByClassName("main_hide_col_button")[0].addEventListener("click",function() {

                this.setColVisible(i,false);
            }.bind(this))

            
            mc.getElementsByClassName("main_open_col_button")[0].addEventListener("click",function() {

                this.setColVisible(i,true);
            }.bind(this))



        }
    
    
        for (let i=0;i<this.mainColumnNum-1;i++)
        {
            let sep = document.getElementById("separator"+(i+1));
    
            sep.addEventListener("mousedown",function(e){
                if (this.selectedSeparator===-1)
                this.selectedSeparator = i;
            }.bind(this))
    
            //sep.style.left = (sp[i])+"px"
    
            this.separatorDiv.push(sep);
        }
        
    
    
        this.updateMainCol();
    
        this.setPageStatus("Loading WASM","waiting")


        this.fileCacheURL = {};

        this.samplesData;

        this.sampleListDiv =
         {
            "examples":document.getElementById("select_examples"), 
            "tests":document.getElementById("select_tests")
        };

    
    

        //this.selectedFile = -1;
        //this.runtimeFile = -1;
        this.funcName = "main";


        $.getJSON( "./samples/data.json", function(res) {
            this.samplesData = res;
    
    
            let mainTests = [];
    
            this.samplesData["unit_tests"]["files"].forEach(function (testId) {
    
                let ff = [
                    {
                        name: testId+".das",
                        path: this.samplesData["unit_tests"]["to_path"],
                        url: this.samplesData["unit_tests"]["url"]+testId+".das"}];
    
                        this.samplesData["unit_test_dependencies"].forEach(function (depGroup) {
    
                    depGroup["files"].forEach(function (file) {
                        ff.push(
                            {
                                name:file,
                                path:depGroup["to_path"],
                                url: depGroup["url"]+file
                            })
                    })
    
                })
    
                mainTests.push({
                    name : testId,
                    files : ff,
                    correct_output : [],
                    func : "test"
                })
            }.bind(this));
    
            this.samplesData["tests"] = mainTests.concat(this.samplesData["tests"]);
    
            ["example","test"].forEach(function (n) {
    
                let ll = this.sampleListDiv[n+"s"];
                while (ll.firstChild) {
                    ll.removeChild(ll.lastChild);
                }
    
                for (let i=0;i<this.samplesData[n+"s"].length+1;i++)
                {
                    let newO = document.createElement("option");
                    if (i===0)
                    {
    
                        newO.innerText = "Select "+n;
                        newO.value = "init";
                    }
                    else
                    {
                        newO.innerText = this.samplesData[n+"s"][i-1].name;
                        newO.value = i-1;
    
                    }
                    ll.appendChild(newO);
                }
            }.bind(this));
    
            this.selectSample("examples",0);
    
    
    
        }.bind(this));
    
    
        this.outputPool = [];

        this.sampleListDiv["examples"].addEventListener("change",
            function() {
                this.selectSample('examples')
            }.bind(this)
        );


        this.sampleListDiv["tests"].addEventListener("change",
            function() {
                this.selectSample('tests')
            }.bind(this)
        );

        document.getElementById("run_tests").addEventListener("click",
            function() {
                this.runTests();
            }.bind(this))


        document.getElementById("run_code").addEventListener("click",
            function() {
                this.runCode()
            }.bind(this))

        document.addEventListener("mousemove",function(e){
            
            if (this.selectedSeparator!==-1)
            {
                e.preventDefault();
                this.setMainColPos(e.clientX);
            }
        }.bind(this));
    
        document.addEventListener("mouseup", function(){
            this.selectedSeparator = -1;
        }.bind(this));

        window.addEventListener("error", function(message)
        {
            this.outputView.print(message,'error');
            this.outputView.print("An error occurred, you may need to reload the page",'error');
        }.bind(this));
        
        window.addEventListener("resize",function() 
        {
            console.log("!!!!!!!!!")
            this.updateMainCol();
        }.bind(this));
        

        this.runtimeController.onPrint = function(text){
            

            this.outputView.print(text,"");

            this.outputPool.push(text);

        }.bind(this);


        this.runtimeController.onInit = function() {
            
            this.setPageStatus("Runtime Ready","ready")
        }.bind(this);

    }


    setPageStatus(text,type) {

        this.statusDiv.classList.toggle("waiting",type=="waiting");
        this.statusDiv.classList.toggle("ready",type=="ready");
        this.statusDiv.innerText = text;
    }


    updateMainCol() {
            
        let hiddenWidth = 80/window.innerWidth;

        let realPos = [this.mainColPos[0],this.mainColPos[1]];



        if (!this.mainColVisible[0])
        {

            realPos[0] = hiddenWidth;

            if (!this.mainColVisible[1])
                realPos[1] = hiddenWidth*2;
        }

        if (!this.mainColVisible[2])
        {
            
            realPos[1] = 1-hiddenWidth;

            if (!this.mainColVisible[1])
                realPos[0] = 1-hiddenWidth*2;
        }
        
        
        if (this.mainColVisible[0] && this.mainColVisible[2])
        {
            
            if (!this.mainColVisible[1])
            {
                realPos[1] = realPos[0]+hiddenWidth;
            }
        }

        


        let wp = [];

        for (let i=0;i<this.mainColumnNum-1;i++)
            wp.push(Math.floor(realPos[i]*window.innerWidth));

        this.mainColumnDiv[0].style.left = "8px";
        for (let i=0;i<this.mainColumnNum-1;i++)
        {

            
            this.separatorDiv[i].style.left = (8+wp[i]-10)+"px"
            this.mainColumnDiv[i+1].style.left = (8+wp[i])+"px"
        }


        this.mainColumnDiv[0].style.width = wp[0]-10+"px";
        
        this.mainColumnDiv[1].style.width = (wp[1]-wp[0]-10)+"px";
        
        this.mainColumnDiv[2].style.width = (window.innerWidth-wp[1]-25)+"px";

        

        for (let i=0;i<this.mainColumnNum;i++)
        {
            this.mainColumnOpenedDiv[i].style.display = this.mainColVisible[i] ? "block" : "none";
            this.mainColumnHiddenDiv[i].style.display = this.mainColVisible[i] ? "none" : "block";
        }
    
    }

    setMainColPos(xx) {

        let wp = xx/window.innerWidth;
    
    
        let wm = 0.1;

        let minw = wm;
        let maxw = 1-wm;
    
        if (this.selectedSeparator>0)
            minw = this.mainColPos[this.selectedSeparator-1]+wm;
    
        if (this.selectedSeparator<this.mainColumnNum-2)
            maxw = this.mainColPos[this.selectedSeparator+1]-wm;
    
        if (wp>maxw)
            wp = maxw;
    
        if (wp<minw)
            wp = minw;
    
            this.mainColPos[this.selectedSeparator] = wp;
    
        this.updateMainCol();
    }

    setColVisible(i,visible) {

        let canChange = true;

        
        let hidden = 0;

        for (let i=0;i<this.mainColumnNum;i++)
            if (!this.mainColVisible[i])
                hidden+=1;

        if (hidden==this.mainColumnNum-1 && visible == false)
            canChange = false;

        if (canChange)
        {
            this.mainColVisible[i] = visible;
            this.updateMainCol();
        }

    }

    getFiles(filesDescription,onComplete) {


        let tempFileSystem = new FileSystem();
    
    
        let getFile = function (i) {
    
            if (i>=filesDescription.length)
            {
                console.log(tempFileSystem.getFiles())
                onComplete(tempFileSystem);
                return;
            }
    
    
            if (filesDescription[i].url)
            {
    
                if (this.fileCacheURL[filesDescription[i].url] !== undefined)
                {
                    tempFileSystem.addFile( filesDescription[i].name,
                             filesDescription[i].path ? filesDescription[i].path : "",
                           this.fileCacheURL[filesDescription[i].url]
                        );
    
                    getFile(i+1);
                }
                else
                {
    
                    $.get(filesDescription[i].url, function(ft) {
    
                        this.fileCacheURL[filesDescription[i].url] = ft;
    
                        tempFileSystem.addFile(filesDescription[i].name,
                                filesDescription[i].path ? filesDescription[i].path : "",
                                ft
                            );
    
                        getFile(i+1);
    
                    }.bind(this), 'text');
                }
            }
            else
            {
                tempFileSystem.addFile(
                    filesDescription[i].name,
                    filesDescription[i].path ? filesDescription[i].path : "",
                    filesDescription[i].text
                )
    
                getFile(i+1);
            }
    
        }.bind(this);
    
        getFile(0);
    
    }
    

    loadSample(type,index,updateEnv,onComplete)
    {

        if (this.runtimeController.loaded)
            this.setPageStatus("Loading files","waiting")


        this.getFiles(this.samplesData[type][index].files,function (fileSystem) {

            if (updateEnv)
            {
                this.fileSystem = fileSystem;
                this.fileSystem.addSelector("browser");
                this.fileSystem.addSelector("runtime");
                this.funcName = this.samplesData[type][index]["func"];
                this.browserView.update();

            }


            if (this.runtimeController.isLoaded())
                this.setPageStatus("Ready","ready")

            if (onComplete)
                onComplete(fileSystem);
        }.bind(this))



    }

    selectSample(type,id) {



        let vv = id !== undefined ? id : parseInt(this.sampleListDiv[type].value);
        if (vv !== NaN)
        {

            this.loadSample(type,vv,true,null)
        }

        this.sampleListDiv[type].value = "init";


    }

    runCode() {

        let fName = this.funcName;
    

        this.runtimeController.setFS(this.fileSystem);

        this.runtimeController.run(this.fileSystem.getFile("runtime").path+this.fileSystem.getFile("runtime").name,
            fName,fName === "test" ? function () {
                this.outputView.print( "TEST FINISHED" ,"test");
        }.bind(this) : null);
    
    
    
    }


    runTest(i) {

        this.loadSample('tests',i,false,function(fileSystem) {
    
            this.outputView.print("Running Test "+(i+1)+"/"+this.samplesData["tests"].length+": "+this.samplesData["tests"][i].name,"test");
    
            this.outputPool = [];
    
            //fName = this.samplesData["tests"][i].function_name ? this.samplesData["tests"][i].function_name : "main";
    
            fileSystem.addSelector("test_runtime")


            this.runtimeController.setFS(fileSystem);

            this.runtimeController.run(fileSystem.getFile("test_runtime").path+fileSystem.getFile("test_runtime").name,this.samplesData["tests"][i]["func"],function () {
    
    
                let ok = true;
    
    
    
                if (this.outputPool.length<this.samplesData["tests"][i].correct_output.length)
                    ok = false;
                else
                    for (let o=0;o<this.samplesData["tests"][i].correct_output.length;o++) {
                        let correct = this.samplesData["tests"][i].correct_output[o];
    
                        if (Array.isArray(correct))
                        {
                            let outp = this.outputPool[o].split(' ');
    
                            if (outp.length<correct.length)
                                ok = false;
                            else
                                for (let k=0;k<correct.length;k++)
                                    if (correct[k] !== null && outp[k] !== correct[k])
                                        ok = false;
    
    
                        }
                        else
                        {
                            if (correct !== null && this.outputPool[o] !== correct)
                                ok = false;
                        }
    
                    }
    
                for (let o=0;o<this.outputPool.length;o++)
                    if (this.outputPool[o].includes("error") || this.outputPool[o].includes("can't"))
                        ok = false;
    
    
                this.outputView.print(this.samplesData["tests"][i].name+" Test "+(i+1)+"/"+this.samplesData["tests"].length+": "+(ok ? "SUCCESS" : "FAIL"),ok ? "success": 'error');
    
                if (i<this.samplesData["tests"].length-1)
                    this.runTest(i+1);
            }.bind(this));
        }.bind(this))
    }
    
    runTests() {


        this.runTest(0);

    }




}