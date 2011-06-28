#canvas-event-js

La forma mas fácil de crear aplicaciones interactivas con el elemento canvas

##Uso

enlazar archivos necesarios
    &lt;script src="Class.js" type="text/javascript" &gt;&lt;/script&gt;
    &lt;script src="events.js" type="text/javascript" &gt;&lt;/script&gt;
    &lt;script src="Shape.js" type="text/javascript" &gt;&lt;/script&gt;

Posicionar relativamente el &lt;canvas&gt;
    &lt;canvas style="position: relative" id="canvas"&gt;&lt;/canvas&gt
    
crear una instancia de canvas-event pasando como argumento el id del elemento o directamente el elemento

    // Id
    Ce = Cevent("canvas");
    
    //pasar elemento
    cv = document.getElementsByTagName("canvas")[0];
    Ce = Cevent(cv);
    
[Documentacion](http://code.google.com/p/canvas-event-js/wiki/Objetos)