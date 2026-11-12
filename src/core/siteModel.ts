import { Interface } from "node:readline";


interface treeNode{
 
    name: string 
    children: treeNode[]
    type: string 
    content: string 
    tags: string[]
    date: string
    layout: string
    url: string 

}

class siteNode implements treeNode{
    name: string 
    children: treeNode[]
    type: string 
    content: string 
    tags: string[]
    date: string
    layout: string
    url: string 

    constructor( 
        name: string, 
        children: treeNode[],
        type: string, 
        content: string ,
        tags: string[],
        date: string,
        layout: string,
        url: string
        ){

            this.name = name
            this.children = children
            this.type = type
            this.content = content
            this.tags = tags
            this.date = date
            this.layout = layout
            this.url = url
    }

}


class SiteModel{

    root: treeNode

    constructor
}