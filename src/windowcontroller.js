

class WindowController
{


    constructor(editor,windowNum,windowSize, windowOpened)
    {

        this.editor = editor;

        this.separatorWidth = 10;
        this.minWidth = 0.1;
        this.hiddenWidth = 0.05;


        this.columnNum = windowNum;
        this.colPos = windowSize;
        this.colVisible = windowOpened;

        this.colAnchor = [];

        for (let i=0;i<this.columnNum;i++)
            this.colAnchor.push(-1);


        
        this.separatorDiv = [];
        this.columnDiv = [];
        

        this.columnOpenedDiv = [];
        this.columnHiddenDiv = [];
        this.columnHiddenHeaderDiv = [];

        this.selectedSeparator = -1;


        this.mainBlockDiv = [];
        this.mainOptionsHeight = [];


        for (let i=0;i<this.columnNum;i++)
        {
            let mc = document.getElementById("main_col"+(i+1));
            this.columnDiv.push(mc);


            let mco = mc.getElementsByClassName("main_col_opened")[0];
            this.columnOpenedDiv.push(mco);

            let mch = mc.getElementsByClassName("main_col_hidden")[0];
            this.columnHiddenDiv.push(mch);

            let mchh = mch.getElementsByClassName("main_col_hidden_header")[0];
            this.columnHiddenHeaderDiv.push(mchh);

            mc.getElementsByClassName("main_hide_col_button")[0].addEventListener("click",function() {

                this.setColVisible(i,false);
            }.bind(this))

            
            mc.getElementsByClassName("main_open_col_button")[0].addEventListener("click",function() {

                this.setColVisible(i,true);
            }.bind(this))


            let mcb = mc.getElementsByClassName("main_block")[0];
            this.mainBlockDiv.push(mcb);

            
            let mcc = mc.getElementsByClassName("main_options")[0];
            this.mainOptionsHeight.push(parseInt(mcc.style.height,10));

        }
    
    
        for (let i=0;i<this.columnNum-1;i++)
        {
            let sep = document.getElementById("separator"+(i+1));
    
            sep.addEventListener("mousedown",function(e){
                if (this.selectedSeparator===-1)
                this.selectedSeparator = i;
            }.bind(this))
    
            this.separatorDiv.push(sep);
        }
        
    
    
        this.updateCol();


        
        document.addEventListener("mousemove",function(e){
            
            if (this.selectedSeparator!==-1)
            {
                e.preventDefault();
                this.setColPos(e.clientX);
            }
        }.bind(this));
    
        document.addEventListener("mouseup", function(){
            this.selectedSeparator = -1;
        }.bind(this));

        
        window.addEventListener("resize",function() 
        {
            this.updateCol();
        }.bind(this));

    
    }



    updateCol(updI)
    {


        let horizontalView = window.innerHeight < window.innerWidth;

        let anchorCopy = -1;
        if (typeof updI !== "undefined")
            anchorCopy = this.colAnchor[updI]


        for (let i=0;i<this.columnNum;i++)
                this.colAnchor[i] = -1;

        for (let i=0;i<this.columnNum;i++)
        {
            if (!this.colVisible[i] && this.colAnchor[i]===-1)
            {

                let leftI = i;
                let rightI = i;

                



                while (rightI<this.columnNum && !this.colVisible[rightI])
                    rightI+=1;
                
                rightI-=1;

                let res = (leftI<this.columnNum-rightI) ? 0 : 1;

                for (let j=leftI;j<=rightI;j++)
                    if (j===updI)
                    {
                        res = anchorCopy
                    }

                for (let j=leftI;j<=rightI;j++)
                {
                    this.colAnchor[j] = res;
                }


            }

            
        }


        for (let i=0;i<this.columnNum;i++)
        {
            if (this.colVisible[i])
            {
                let res = i < (this.columnNum - 1)/2 ? 0 : 1;

                if (i>0 && i<this.columnNum-1)
                {

                    if (!this.colVisible[i-1])
                    res = this.colAnchor[i-1];

                    if (!this.colVisible[i+1])
                    res = this.colAnchor[i+1];
                }
                
                if (i===updI && this.columnNum % 2 === 1 && i==(this.columnNum-1)/2)
                {
                    res = anchorCopy;
                }
                
                this.colAnchor[i] = res;
            }
        }


        for (let i=0;i<this.columnNum-1;i++)
        {
            if (!this.colVisible[i] && this.colAnchor[i]===0)
            {
                let prev = 0;

                if (i>0)
                    prev = this.colPos[i-1];

                this.colPos[i] = prev + this.hiddenWidth;   
            }   
        }

        
        for (let i=this.columnNum-2;i>=0;i--)
        {
            if (!this.colVisible[i+1] && this.colAnchor[i+1]===1)
            {
                let prev = 1;

                if (i<this.columnNum-2)
                    prev = this.colPos[i+1];

                this.colPos[i] = prev - this.hiddenWidth;   
            }   
        }


        let wp = [0];

        for (let i=0;i<this.columnNum-1;i++)
            wp.push(Math.floor(this.colPos[i]*(window.innerWidth-this.separatorWidth)));

        wp.push(window.innerWidth-this.separatorWidth);



        let mainHeight = window.innerHeight-250;

        let vertHeightHidden = 30;
        let vertHeightOpened = 500;

        if (mainHeight<500)
            mainHeight = 500;


        if (!horizontalView)
        {
            mainHeight =0;
            for (let i=0;i<this.columnNum;i++)
            {
                mainHeight += this.colVisible[i] ? vertHeightOpened : vertHeightHidden;
                if (i<this.columnNum-1)
                    mainHeight+=10;

            }

        }



        

        for (let i=0;i<this.columnNum-1;i++)
        {
            if (horizontalView)
            {
                this.separatorDiv[i].style.left = (wp[i+1]-5)+"px";
                this.separatorDiv[i].style.display = "block"
            }
            else
            {
                this.separatorDiv[i].style.display = "none"
            }
        }
            

        for (let i=0;i<this.columnNum;i++)
        {
            if (horizontalView)
            {
                    
                this.columnDiv[i].style.left = (wp[i]+this.separatorWidth-4)+"px";
                this.columnDiv[i].style.width = (wp[i+1]-wp[i]-this.separatorWidth-2)+"px"

                
                //this.columnDiv[i].style.top = "0px";
                this.columnDiv[i].style.height = null;
                this.columnDiv[i].style.marginBottom = "0px";

                this.columnDiv[i].style.position = "absolute"
            }
            else
            {

                this.columnDiv[i].style.left = "10px";
                this.columnDiv[i].style.width = (window.innerWidth-30)+"px"

                
                //this.columnDiv[i].style.top = (15)+"px";
                this.columnDiv[i].style.height = ((this.colVisible[i] ? vertHeightOpened : vertHeightHidden))+"px";
                this.columnDiv[i].style.marginBottom = "10px";

                this.columnDiv[i].style.position = "relative"
                
            }
        }
        
        for (let i=0;i<this.columnNum;i++)
        {
            this.columnOpenedDiv[i].style.display = this.colVisible[i] ? "block" : "none";
            this.columnHiddenDiv[i].style.display = this.colVisible[i] ? "none" : "block";

            this.columnHiddenHeaderDiv[i].classList.toggle("horizontal",!horizontalView);
            this.columnHiddenHeaderDiv[i].classList.toggle("vertical",horizontalView);
        }

        for (let i=0;i<this.columnNum;i++)
        {
            let hide = this.columnOpenedDiv[i].getElementsByClassName("main_hide_col_button")[0];

            let leftPos = this.colAnchor[i]===0 || !this.horizontalView;
         
            hide.classList.toggle("left_anchor",leftPos);
            hide.classList.toggle("right_anchor",!leftPos);

            let show = this.columnHiddenDiv[i].getElementsByClassName("main_open_col_button")[0];
            show.classList.toggle("left_anchor",leftPos);
            show.classList.toggle("right_anchor",!leftPos);

        }


        for (let i=0;i<this.columnNum;i++)
        {
            
            if (horizontalView)
            {
                    
                this.mainBlockDiv[i].style.height = (mainHeight-this.mainOptionsHeight[i])+'px'
            }
            else
            {
                this.mainBlockDiv[i].style.height = (500-this.mainOptionsHeight[i])+'px'
            }
        }

        document.querySelector(':root').style.setProperty('--main-height', mainHeight+'px');


    }


    setColPos(xx) {

        
        let leftI = this.selectedSeparator;
        let rightI = this.selectedSeparator;



        while (leftI>=0 && !this.colVisible[leftI])
            leftI-=1;
        while (rightI<this.columnNum-1 && !this.colVisible[rightI+1])
            rightI+=1;
        


        if (leftI>=0 && rightI<=this.columnNum-2)
        {

            let oldP = this.colPos[this.selectedSeparator];
            let newP = xx/(window.innerWidth-this.separatorWidth);
            let dist = newP - oldP;



            let leftLim = 0+this.minWidth;
            let rightLim = 1-this.minWidth;

            if (leftI>0)
                leftLim = this.colPos[leftI-1] + this.minWidth;

            if (rightI<this.columnNum-2)
                rightLim = this.colPos[rightI+1] - this.minWidth;

            if (this.colPos[rightI]+dist > rightLim)
                dist = 0;

            if (this.colPos[leftI]+dist < leftLim)
                dist = 0;




            for (let i=leftI;i<=rightI;i++)
                this.colPos[i]+=dist;
        }
    
        this.updateCol();
    }

    setColVisible(i,visible) {

        
    

        let canChange = true;

        
        let hidden = 0;

        for (let j=0;j<this.columnNum;j++)
            if (!this.colVisible[j])
                hidden+=1;

        if (hidden==this.columnNum-1 && visible == false)
            canChange = false;

        if (canChange)
        {
            this.colVisible[i] = visible;
   


            
            if (visible) 
            {
                if (this.colAnchor[i]===0)
                {
                    for (let j=this.columnNum-2;j>=i;j--)
                    {
                        let prev = 1;

                        if (j<this.columnNum-2)
                            prev = this.colPos[j+1];

                        if (this.colVisible[j+1])
                            this.colPos[j] = prev - Math.max(this.minWidth,(prev - this.colPos[j]) * 0.75);
                        else
                            this.colPos[j] = prev - this.hiddenWidth;

                    }

                    
                }
                else
                {
                    for (let j=0;j<i;j++)
                    {
                        let prev = 0;

                        if (j>0)
                            prev = this.colPos[j-1];

                        if (this.colVisible[j])
                            this.colPos[j] = prev + Math.max(this.minWidth,(this.colPos[j]-prev) * 0.75);
                        else
                            this.colPos[j] = prev + this.hiddenWidth;

                    }
                }
            }

            this.updateCol(i);
        }

    }

}
