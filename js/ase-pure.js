// Set canvas for 1rst targetface
var canvas1rstName = window.document.getElementById("canvas1rstTargetFace");
var ctx1rst = canvas1rstName.getContext("2d");
// Set the chart
var canvas1rstChart = window.document.getElementById("canvas1rstStats");
var ctx1rstChart = canvas1rstChart.getContext("2d");

/**
 * Generating random number
 * @param {number} maxNo
 * @return {number} randomNumber
 */
function getRandomNumber(maxNo) {
    var randomNumber = Math.floor(Math.random() * maxNo + 1);
    return randomNumber;
}

// Our targetFace object
var targetFace = {
    size: 400, // size of targetface in mm
    arrowCount: 0, // No of arrows shot
    sumOfBigTarget: 0,
    roundCount: 0,

    /**
     * Drawing the score circles on targetFace
     * @param {context} cctx
     * @param {number} targetSize
     */
    drawTF: function(cctx, targetSize) {
        for (var i = 0; i <= 10; i++) {
            cctx.beginPath();
            cctx.arc(targetSize / 2, targetSize / 2, i * targetSize / 20, 0, 2 * Math.PI, false);
            cctx.strokeStyle = '#d8d8d8';
            cctx.lineWidth = 1;
            cctx.stroke();
        }
    },

    /**
     * Drawing an arrow on targetFace with paramteres
     * @param {context} cctx
     * @param {number} x
     * @param {number} y
     */
    drawArrow: function(cctx, x, y) {  
        cctx.fillRect(x, this.size - y, 1, 1);
    },

    /**
     * Clearing canvas and chart, redraw targetface canvas
     * @param {context} ctx
     * @param {context} ctxChart
     */
    clearCanvasChart: function(ctx, ctxChart) {
        ctx.clearRect(0, 0, this.size, this.size);
        ctxChart.clearRect(0, 0, this.size, 300);
        this.drawTF(ctx, this.size);
        document.getElementById("tmpOutput").innerHTML = "";
    },

    /**
     * Shooting 1 arrow and getting the score of it
     * @param {number} maxRadius
     * @param {number} targetfaceRadius
     * @return {number} diameter
     */
    getTFOneScore: function(maxRadius, targetfaceRadius) {
        var x = 0,
            y = 0,
            drawx = 0,
            drawy = 0,
            distanceFromCenter = 0,
            scoreRadius = targetfaceRadius / 10, // starting with 10 ring which has 20mm radius (400/20) on 40cm targetface
            scoreValue = 10; // starting score value
        do {
            if (scoreRadius > maxRadius) {
                scoreRadius = maxRadius;
            }
            x = getRandomNumber(maxRadius * 2);
            y = getRandomNumber(maxRadius * 2);
            // Getting distance from center
             
            distanceFromCenter = Math.sqrt(Math.pow((maxRadius - x), 2) + Math.pow((maxRadius - y), 2));
            while (parseFloat(distanceFromCenter) <= parseFloat(maxRadius)) {
                // console.log("scoreRadius:" ,scoreRadius, "scoreValue:",scoreValue);
                if (parseFloat(distanceFromCenter) <= parseFloat(scoreRadius)) {
                    drawx = this.size / 2 - maxRadius + x;
                    drawy = this.size / 2 - maxRadius + y; 
                    this.drawArrow(ctx1rst, drawx, drawy);  
                    this.arrowCount++;
                    // document.getElementById("tmpOutput").innerHTML += "x: " + x + ", y: " + y + ", drawx: " + drawx + ", drawy: " + drawy + ", score: " + scoreValue + ", distanceFromCenter: " + distanceFromCenter + "<br>";
                    // console.log("drawx:",drawx,"drawy:",drawy,"scoreValue:",scoreValue,"distanceFromCenter:",distanceFromCenter);
                    return scoreValue;
                } else {    
                    scoreRadius += targetfaceRadius / 10;
                    scoreValue--;
                }
            }
        } while (distanceFromCenter > maxRadius);
    },

    /**
     * Shoots a round of arrows to the given target size and returns the score
     * @param {number} maxRadius
     * @return {number} scoreOfRound
     */
    getRoundScore: function(maxRadius, scoreToTest) {
        var scoreOfRound = 0;
        //scoreToTest = +document.getElementById("inputScore2").value;
        do {
            scoreOfRound += parseInt(this.getTFOneScore(parseInt(maxRadius), this.size / 2));
            // console.log("scoreOfRound: ",scoreOfRound, "maxRadius: ", maxRadius);
        } while (this.arrowCount % 30 !== 0);
        this.roundCount++;
        // console.log("roundCount:",this.roundCount,"arrowCount:",this.arrowCount,"radius: ",maxRadius,"scoreOfRound: ",scoreOfRound);
        if (scoreToTest - 5 <= scoreOfRound && scoreOfRound <= scoreToTest + 5) {
            ctx1rstChart.fillStyle = "#007BFF";
        } else {
            ctx1rstChart.fillStyle = "#000000";
        }  
        ctx1rstChart.fillRect(parseInt(maxRadius), 300 - parseInt(scoreOfRound), 1, 1);
        return scoreOfRound;
    },

    /**
     * Shoots a No of rounds to the target and returns the diameter of shooting
     * to get the given score
     * @return {number} diameter
     */
    getXRoundsDiam: function(scoreToTest) {
        var radius = this.size / 2,
            //scoreToTest = +document.getElementById("inputScore2").value,
            i = 0,
            radiusSum = 0,
            radiusNo = 0,
            actualScore = 0,
            helper = 0,
            roundsNr = 200;
        for (i = roundsNr; i > 0; i--) {
            actualScore = this.getRoundScore(parseInt(radius), scoreToTest);
            if (scoreToTest - 5 <= actualScore && actualScore <= scoreToTest + 5) {
                radiusSum += radius;
                radiusNo++;
                // document.getElementById("tmpOutput").innerHTML += "score: " + actualScore + " with radius: " + radius + "<br>";
            }
            radius -= this.size / 2 / roundsNr;
        }
        if (radiusSum !== 0 && radiusNo !== 0)
            // document.getElementById("tmpOutput").innerHTML += "Average radius for higher score: " + Math.round(radiusSum/radiusNo) + "<br>";
            return parseInt(radiusSum / radiusNo);
    },

    /**
     * Shooting runCount times 200 rounds to get diameter for given score
     * @return {number} finalDiam
     */
    getRoundDiamAverages: function(scoreToTest) {
        this.clearCanvasChart(ctx1rst, ctx1rstChart);
        var runCount = 32,
            runSum = 0,
            finalDiam = 0;
        for (var i = 0; i < runCount; i++) {
            runSum += this.getXRoundsDiam(scoreToTest);
        }
        finalDiam = Math.round(runSum / runCount);
        // document.getElementById("tmpOutput").innerHTML += "Optimal radius for higher score: " + finalDiam + "<br>";
        return finalDiam;
        //CanvasObject.GetComponent<Canvas>().enabled = false;
    },

    /**
     * Shooting 30 arrows and getting the score of it, drawing on the chart
     * @param {number} maxRadius
     * @param {number} targetfaceRadius
     * @return {number} diameter
     */
    getTFRoundScore: function(maxRadius, targetfaceRadius) {
        var roundScore = 0;
        for (var i = 0; i < 30; i++) {
            roundScore += this.getTFOneScore(maxRadius, targetfaceRadius);
        }
        // document.getElementById("tmpOutput").innerHTML += "Round score: " + roundScore + " at targetfaceRadius" + targetfaceRadius + "<br>";
        return roundScore;
    },

    /**
     * Simulating target ratio decreasing until we get the desired lower score
     * with grouping of higher score shooter
     * @return {number} diameter
     */
    getTargetSize: function(scoreHigh, scoreLow, groupingSize) {
        this.clearCanvasChart(ctx1rst, ctx1rstChart);
        var roundCount = 200,
            targetfaceRadius = 200,
            targetSizeSum = 0,
            targetSizeNo = 0;
        do {
            for (var i = 0; i < 10; i++) {
                actualScore = this.getTFRoundScore(groupingSize, targetfaceRadius);
                if (scoreLow - 5 <= actualScore && actualScore <= scoreLow + 5) {
                    targetSizeSum += targetfaceRadius;
                    targetSizeNo++;
                    ctx1rstChart.fillStyle = "#007BFF";
                    // document.getElementById("tmpOutput").innerHTML += "score: " + actualScore + " with targetSize: " + targetfaceRadius + "<br>";
                } else {
                    ctx1rstChart.fillStyle = "#000000";
                }
                ctx1rstChart.fillRect(targetfaceRadius, 300 - actualScore, 1, 1);
            }
            targetfaceRadius--;
        } while (targetfaceRadius >= groupingSize);
        // document.getElementById("tmpOutput").innerHTML += "Best targetface radius for high score shooter to shoot around " + scoreLow + ": " + parseInt(targetSizeSum/targetSizeNo) + "<br>";
        return parseInt(targetSizeSum / targetSizeNo);
    }
}; // End of targetFace object

// jquery button click
$('#buttonGetGrouping').on('click', function() {
    scoreToTest = +document.getElementById("inputScore2").value;
    scoreToTest2 = +document.getElementById("inputScore1").value;
    document.getElementById("inputAvgRadius2").value = targetFace.getRoundDiamAverages(scoreToTest);
    document.getElementById("inputAvgRadius1").value = targetFace.getRoundDiamAverages(scoreToTest2);
});

var arrText = new Array();

$('#buttonGetTargetSize').click(function(e) {
    e.preventDefault();

    var doCountAvg = 0;
    var idNo = 0;
    var minScore = 0;
    var actualScore = 0;
    // document.getElementById("buttonGetTargetSize").classList.add("is-loading");

    $('.container').each(function(i) {
        if (typeof arrText[i] == "undefined")
            arrText[i] = {};

        $(this).find('input[type=text]').each(function(j) {
            // Actual property name stored
            var propName = $(this).attr("id").slice(0, -1);
            // Actual input row number of form. 4 input fields / row
            var actInNo = Math.floor(j / 4);
            // Declaring object when first element is seelcted
            if (propName == "inputArcherName") {
                arrText[actInNo] = {};
            }
            if (propName !== "inputFileNam") {
                // Store property value
                arrText[actInNo][propName] = $(this).val();
                if (propName == "inputScore" && arrText[actInNo]["inputScore"] !== "") {
                    arrText[actInNo]["idNo"] = $(this).attr("id")[$(this).attr("id").length - 1];
                    idNo = arrText[actInNo]["idNo"];

                    if (minScore == 0 || minScore > arrText[actInNo][propName]) {
                        minScore = arrText[actInNo][propName];
                    }
                    doCountAvg = 1;
                }
                if (propName == "inputAvgRadius" && doCountAvg == 1) {
                    // Plus sign is needed because we want the input to be number
                    actualScore = +arrText[actInNo]["inputScore"];
                    // Let's check if there were already the same score entered so they won't differ
                    for (var j = 0; j <= actInNo; j++) {
                        if (actualScore == arrText[j]["inputScore"] && actInNo != 0) {
                            arrText[actInNo][propName] = arrText[j][propName];
                            document.getElementById(`inputAvgRadius${idNo}`).value = arrText[actInNo][propName];
                        } else {
                            if (j == 0 || j != actInNo) {
                                arrText[actInNo][propName] = targetFace.getRoundDiamAverages(actualScore);
                                document.getElementById(`inputAvgRadius${idNo}`).value = arrText[actInNo][propName];
                            }
                        }
                    }
                    doCountAvg = 0;
                }

            } else {
                var fileName = $(this).val();
            }
        }); // End of "find each text input" loop
    }); // End of "each object" loop in container

    for (var k = 0; k < arrText.length; k++) {
        actualScore = +arrText[k]["inputScore"];
        console.log(typeof(actualScore));
        var actualRadius = +arrText[k]["inputAvgRadius"];
        if (actualScore !== parseInt(minScore)) {
            if (actualScore !== 0) {
                      var index = arrText.findIndex(x => x.inputScore==actualScore);
                      if (index == k) {
                          document.getElementById(`inputSugRadius${k+1}`).value = targetFace.getTargetSize(actualScore, parseInt(minScore), actualRadius);
                          arrText[k]["inputSugRadius"] = +document.getElementById(`inputSugRadius${k+1}`).value;
                      } else {
                          document.getElementById(`inputSugRadius${k+1}`).value = arrText[index]["inputSugRadius"];
                          arrText[k]["inputSugRadius"] = +document.getElementById(`inputSugRadius${k+1}`).value;
                      }
            }
        } else {
            document.getElementById(`inputSugRadius${k+1}`).value = 200;
            arrText[k]["inputSugRadius"] = +document.getElementById(`inputSugRadius${k+1}`).value;
        }
    }

    console.log(arrText);

    // document.getElementById("buttonGetTargetSize").classList.remove("is-loading");
}); // End of buttonGetTargetSize click event function

function convertToPdf(svg, callback) {
    // Call svgAsDataUri from saveSvgAsPng.js
    window.svgAsDataUri(svg, {}, svgUri => {
        // Create an anonymous image in memory to set
        // the png content to
        let $image = $("<img>"),
            image = $image[0];

        // Set the image's src to the svg png's URI
        image.src = svgUri;
        $image.on("load", () => {
            // Once the image is loaded, create a canvas and
            // invoke the jsPDF library
            let canvas = document.createElement("canvas"),
                ctx = canvas.getContext("2d"),
                // Default size was:
                doc = new jsPDF("portrait", "mm"),
                // A4
                //doc = new jsPDF('p', 'mm', [297, 210]);
                // A3
                //doc = new jsPDF('p', 'mm', [410, 297]);
                //  imgWidth = image.width,
                //  imgHeight = image.height;
                // Setting the quality of the image
                imgWidth = 2000,
                imgHeight = 2000,
                // If it is 2, than it is going to be a 40cm targetface. In case of 1, than it is 20cm and it fits exatly to a A4 paper.
                scalingTmp = 2;

            function getImage(newDiameter) {
                let scalingFactor = scalingTmp * (newDiameter / 200);
                // Set the canvas size to the size of the image
                canvas.width = imgWidth;
                canvas.height = imgHeight;
                // Fill the black background
                ctx.fillStyle = "#FFF";
                ctx.fillRect(0, 0, 2000, 2000);

                // Draw the image to the canvas element
                // zooming the image and positioning on the canvas
                ctx.drawImage(
                    image,
                    (imgWidth * scalingFactor - imgWidth) / -2,
                    (imgHeight * scalingFactor - imgHeight) / -2,
                    imgWidth * scalingFactor,
                    imgHeight * scalingFactor
                );

                return canvas.toDataURL("image/jpeg");
            }

            let inputDiams = document.getElementsByClassName("diameter");
            for (let i = 0; i < inputDiams.length; i++) {
                let dataUrl = getImage(inputDiams[i].value);
                // Where and which size to display picture on pdf page
                doc.addImage(dataUrl, "JPEG", 5, 49, 200, 200);
                doc.setFontSize(9);
                doc.text(10, 10, 'Name: ' + arrText[i]["inputArcherName"].toString());
                doc.text(10, 15, 'Average Score: ' + arrText[i]["inputScore"].toString());
                // Getting radius from array of objects
                // doc.text(10, 20, 'Radius: ' + arrText[i]["inputSugRadius"].toString() + ' mm');
                // Getting radius from entered value
                if (inputDiams[i].value != arrText[i]["inputSugRadius"].toString()) {
                    doc.text(10, 20, 'Radius: ' + inputDiams[i].value + ' mm (entered by user)');
                } else {
                    doc.text(10, 20, 'Radius: ' + inputDiams[i].value + ' mm (calculated)');
                }
                if (i !== inputDiams.length - 1) doc.addPage();
            }
            callback(doc);
        });
    });
}

function downloadPdf(fileName, pdfDoc) {
    // Dynamically create a link
    let $link = $("<a>"),
        link = $link[0],
        dataUriString = pdfDoc.output("dataurlstring");

    // On click of the link, set the HREF and download of it
    // so that it behaves as a link to a file
    $link.on("click", () => {
        link.href = dataUriString;
        link.download = fileName;
        $link.detach(); // Remove it from the DOM once the download starts
    });

    // Add it to the body and immediately click it
    $("body").append($link);
    $link[0].click();
}

// Save to PDF button click handler
$("#buttonSavePdf").on("click", () => {
    // Let's see if there's an empty diamater input field
    let arrayDiams = document.getElementsByClassName("diameter");
    // arrayDiams.forEach(function(element) {
    for (let i = 0; i < arrayDiams.length; i++) {
        if (arrayDiams[i].value == "") {
            $('#buttonGetTargetSize').click();
        }
    };
    // Convert it to PDF first
    convertToPdf($("#svg")[0], doc => {
        // Get the file name and download the pdf
        let filename = $("#inputFileName").val();

        downloadPdf(filename, doc);
    });
});

targetFace.drawTF(ctx1rst, targetFace.size);
