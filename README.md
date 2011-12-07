#canvas-event-js

La forma mas fácil de crear aplicaciones interactivas con el elemento canvas

##Uso

enlazar archivos necesarios

    <script src="Class.js" type="text/javascript" ></script>
    <script src="events.js" type="text/javascript" ></script>
    <script src="Shape.js" type="text/javascript" ></script>

Posicionar relativamente el &lt;canvas&gt;

    <canvas style="position: relative" id="canvas"></canvas>
    
crear una instancia de canvas-event pasando como argumento el id del elemento o directamente el elemento

    // Id
    Ce = Cevent("canvas");
    
    //pasar elemento
    cv = document.getElementsByTagName("canvas")[0];
    Ce = Cevent(cv);
    
[Documentación](http://sney2002.github.com/canvas-event-js)