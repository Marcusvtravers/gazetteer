

var map = L.map('map').setView([0,0], 2);

var Thunderforest_Landscape = L.tileLayer('https://{s}.tile.thunderforest.com/landscape/{z}/{x}/{y}.png?apikey={apikey}', {
	attribution: '&copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	apikey: '1eccea5134314562a5aa86cd7a01e8da',
	maxZoom: 22
}).addTo(map);


var popup = L.popup();

var redIcon = L.icon({
  iconUrl: 'marker-icon-2x-red.png',
  iconSize: [25,41],
  iconAnchor: [12,41],
  popupAnchor: [1,-34],
  shadowSize: [41,41]
})


var options = {
  enableHighAccuracy: true,
  timeout: 5000,
  maximumAge: 0
};


var marker = L.marker();

//Making a function that asks for permission from the user to share their location, then place a marker with a welcome message and instructions on what gazetteer does. 
function success(pos) {

  var crd = pos.coords;
  var latlng = `${crd.latitude},${crd.longitude}`
  $.ajax({
    url: 'libs/php/getOpenCage.php',
    type: 'GET',
    data: {
      'key': '4bf6c8977b574b13989a6f8607c716e3',
      'q': latlng,
      'no_annotations': 1
    },
    dataType: 'json',
    success:function(res){
      console.log(res)
      $('#road').html(res['data']['results'][0]['components']['road'])
      $('#city').html(res['data']['results'][0]['components']['city'])
      $('#country').html(res['data']['results'][0]['components']['country'])
    }
  })
  marker = L.marker([crd.latitude, crd.longitude]).bindPopup(`<b>Welcome to Gazetteer!</b> 
  </br>Thank you for joining us from <span id=road></span> - <span id=city></span>, <span id=country></span>.
  </br> Please click on a country or use the select bar to select a country to discover information about a chosen country.
  `)
  marker.addTo(map).openPopup();
  var latLngs = [marker.getLatLng()];
  var markerBounds = L.latLngBounds(latLngs)
  map.flyToBounds(map.fitBounds(markerBounds,{maxZoom: 6})) 
  
}

function error(err) {
  console.warn(`ERROR(${err.code}): ${err.message}`);
}

navigator.geolocation.getCurrentPosition(success, error, options);


// Function for clicking on the map
$.fn.myfunction = function(){
    map.on('click', function(e){
        let lat = e.latlng.lat;
        let lng = e.latlng.lng;
        let latlng = `${lat},${lng}`;
      
        if (marker){
          map.removeLayer(marker)
        }
    //Using the latitude and longitude retrieved from clicking on the map and using the data retrieved here for future AJAX calls. 
  
    $.ajax({
      url: 'libs/php/getOpenCage.php',
      type: 'GET',
      data: {
        'key': '4bf6c8977b574b13989a6f8607c716e3',
        'q': latlng,
        'no_annotations': 1
      },
      dataType: 'json',
      
        success:function(response){  
          
          const countrycode = response.data.results[0].components.country_code;
          const countrycodeUpper = countrycode.toUpperCase();
          
          $('.continent').html(response['data']["results"][0]["components"]["continent"]);
          
          //AJax call for covid data 
          $.ajax({
            url: "libs/php/getCovidData.php",
            type: 'GET',
            dataType: 'json',
            success: function(res){
           
            for (let i = 0; i < res.data.length; i++){
              const code = res.data[i].code

              if (code === countrycodeUpper){
                
                $('#countryNameCovid').html(res['data'][i]['name'])
                $('#confirmedCovid').html(res['data'][i]['latest_data']['confirmed'])
                $('#criticalCovid').html(res['data'][i]['latest_data']['critical'])
                $('#deathsCovid').html(res['data'][i]['latest_data']['deaths'])
                $('#covidCasesPerMil').html(res['data'][i]['latest_data']['calculated']['cases_per_million_population'])
                $('#recoveredCovid').html(res['data'][i]['latest_data']['recovered'])
                $('#deathRateCovid').html(res['data'][i]['latest_data']['calculated']['death_rate'])
                $('#recoveredCovid').html(res['data'][i]['latest_data']['calculated']['recovered'])
                $('#recoveryRateCovid').html(res['data'][i]['latest_data']['calculated']['recovery_rate'])
                $('#todayConfirmedCovid').html(res['data'][i]['today']['confirmed'])
                $('#todayDeathsCovid').html(res['data'][i]['today']['deaths'])
                $('#updatedAt').html(res['data'][i]['updated_at'])
              }
            }
              
            },
            error: function(error){
              console.log(error)
            }
          })
          
          //Ajax call for getting the coordinates of the city markers and placing them onto the map 
          $.ajax({
            url: 'libs/php/getCityMarkers.php',
             type: 'GET',
             dataType: 'JSON',
             success:function(res){
               
               var marker = L.marker();
               var markers = L.featureGroup();
              
               //Removing each marker when the map is clicked or when the select menu is changed
               if (markers){
                 map.on('click', function(){
                   markers.eachLayer(function(layer){
                     markers.removeLayer(layer)
                   })
                 })
                 $('#countryselect').change(function(){
                   markers.eachLayer(function(layer){
                     markers.removeLayer(layer)
                   })
                 })
               }
              
               for (let i = 0; i < res.data.length; i++){
                
                 const isoA2 = res.data[i].iso2;
                 const iso2 = isoA2.toLowerCase();
                 if (iso2 === countrycode){
                 
                  
                   const cityMarkerLat = res.data[i].lat;
                   const cityMarkerLng = res.data[i].lng;
                   const city = res.data[i].city
                   
                   const cityPop = res.data[i].population;
                  const cityWiki = city.split(" ").join("_")
                
                   //Putting the Capital city on a different marker
                   if (res.data[i].capital === 'primary'){
                    marker = L.marker([cityMarkerLat, cityMarkerLng],{
                      icon:redIcon 
                    }).bindPopup( 
                    `  
                    <h6>${city} - Capital</h6>
                    <b>Latitude:</b> ${cityMarkerLat}, 
                    </br><b>Longitude: </b> ${cityMarkerLng}
                    </br><b>Time: </b><span id=time></span>
                    </br><b>Population:</b> ${cityPop}
                    </br><a href='https://en.wikipedia.org/wiki/${cityWiki}' target=_blank >Wikipedia</a>
                    <hr>
                    <h6>Weather</h6>
                     <b>Weather:</b> <span class=weathermain></span> - <span class=weatherdesc></span>
                     </br><b>Temperature: </b><span class=txttemp></span></br><b>Feels like:</b> <span class=feelslike></span>
                     </br><b>Temp max: </b><span class=tempmax></span></br> <b>Temp min: </b><span class=tempmin></span>
                     </br> <b>Humidity: </b><span class=txthumidity></span></p>`)
                    } else {
                     marker = L.marker([cityMarkerLat, cityMarkerLng]).bindPopup(`
                     <h6>${city}</h6>
                     <b>Latitude:</b> ${cityMarkerLat}, 
                     </br><b>Longitude: </b> ${cityMarkerLng}
                     </br><b>Time: </b><span id=time></span>
                     </br><b>Population:</b> ${cityPop}
                     </br><a href=https://en.wikipedia.org/wiki/${cityWiki} target=_blank >Wikipedia</a>
                     <hr>
                     <h6>Weather</h6>
                      <b>Weather:</b> <span class=weathermain></span> - <span class=weatherdesc></span>
                      </br><b>Temperature: </b><span class=txttemp></span></br><b>Feels like:</b> <span class=feelslike></span>
                      </br><b>Temp max: </b><span class=tempmax></span></br><b> Temp min: </b><span class=tempmin></span>
                      </br> <b>Humidity: </b><span class=txthumidity></span></p>

                     `)
                    }

                    //Getting the timezone on the markers
                    markers.on('mouseover', function(e){
                      let lat = e.latlng.lat;
                      let lng = e.latlng.lng;
                     
                      $.ajax({
                        url: 'libs/php/getTimezone.php',
                        type: 'GET',
                        dataType: "JSON",
                        data: {
                          lat: lat,
                          lng: lng
                        },
                        success: function(result){
                         
                          $('#time').html(result['data']['time'])
                          
                        }
                      })
                    })
                  
                  // Retrieving the weather data from the coordinates of the markers to place on each city 
                   marker.on('mouseover', function(){
                    $.ajax({
                      url: './libs/php/getWeather.php',
                      type: 'GET',
                      dataType: "json",
                      data: {
                        lati: cityMarkerLat,
                        lngi: cityMarkerLng
                      },
                      success: function(result){
                       
                      //Adding data retrieved from this API to HTML 
                      
                        $('.weathermain').html(result['data']['weather'][0]['main']);
                        $('.weatherdesc').html(result['data']['weather'][0]['description']);
                        $('.txthumidity').html(result['data']['main']['humidity'])
                        $('.txttemp').html(result['data']['main']['temp'])
                        $('.feelslike').html(result['data']['main']['feels_like']);
                        $('.tempmax').html(result['data']['main']['temp_max']);
                        $('.tempmin').html(result['data']['main']['temp_min']);
                                   
                      },
                      
                      error: function(error){
                        console.log(error)
                      }
                    })
                                  
                  })
        
                  //adding each marker to a feature group
                   markers.addLayer(marker)
                   markers.addTo(map)
                 }
                 
                 // opening the popup when the mouse is hovering over each marker 
                 marker.on('mouseover', function(){
                   this.openPopup();
                 })
               }
             }, 
             error: function(error){
               console.log(error)
             }
          })
          
          // AJAX call to get the border outline using the countrycode given from a click using the opencagedata api
          $.ajax({
            url: 'libs/php/getCountryBorders.php',
            type: 'GET',
            dataType: "json",
        
            success: function(res){
             
              // Using a for loop to get the properties for a given country depending on where the map is clicked.
              for (let i = 0; i < res.data.features.length; i++){
              const result = res.data.features[i].properties.iso_a2;  
              const result2 = res.data.features[i].properties.iso_a3;
              const lower = result.toLowerCase();
              let outline = res.data.features[i];
              // if statement to compare the data from result of this AJAX call and the countrycode retrieved from the opencagedata API
                if (lower === countrycode){
              //Adding the outline onto the map and removing previously clicked borders from the map. 
                var myLayer =  L.geoJSON(outline).addTo(map)
                  if(myLayer){
                  map.on('click', function(){
                    myLayer.clearLayers();    
                  })
                  $('#countryselect').change(function(){
                    myLayer.clearLayers();
                  })
                  }
                //The transition from given clicks 
                map.flyToBounds(myLayer.getBounds(), {'duration':1.25});     
                }    
              }  
            },
            error: function(error){
              console.log(error)
            }      
          });
      
          //AJAX call for the national holiday data, using the countrycode from opencagedata api 
          
          $.ajax({
            url: 'libs/php/getNationalHolidays.php',
            type: 'GET',
            dataType: "JSON",
            data: {
              country: countrycode
            },
            success: function(result){
              
              const holiday = result.data.holidays
              //Using a for loop to display each holiday retrieved from the getNationalHolidays API
              for (let i = 0; i < holiday.length; i++){
                const holidayname = result.data.holidays[i].name;
                const holidaydate = result.data.holidays[i].date;

                //Adding the data to a table
                var table = document.getElementById('holidayTable')
                var row = `<tr>
                <td>${holidayname}</td><td>${holidaydate}</td>
                </tr>`
                table.innerHTML += row;
                 
                //If there is a previous row then a click function will delete the previous rows of holidays
                if (row){
                  map.on('click', function(){
                    $('#holidayTable').empty();
                  })
                }
              
              }
            },
            error: function(error){
              console.log(error)
            }
          })
          
         
          //AJAX call to get the news from a given country
          $.ajax({
            url: "libs/php/getNews.php",
            type: 'GET',
            dataType: 'JSON',
            data: {
              'country': countrycode,
              
            },
            success: function(result){
               //looping though the data to retrieve the 4 latest news articles available from the API   
              
              for (let i = 0; i < 10; i++){
                try{
                  
                const author = result.data.articles[i].author
                const title = result.data.articles[i].title
                const description = result.data.articles[i].description
                const url = result.data.articles[i].url
                const image = result.data.articles[i].urlToImage
                const publishedAt = result.data.articles[i].publishedAt
                const source = result.data.articles[i].source.name
              

                //Creating the content for the news modal 
                const newstotal = `
                <div class="list-group" >
                <a href="${url}" class="list-group-item list-group-item-action flex-column align-items-start ">
                <img src=${image} alt="News Image" style="height:50%; width:100%;" />
                  <div class="d-flex w-100 justify-content-between">
                  
                    <h5 class="mb-1">${title}</h5>
                  </div>
                  <p class="mb-1">${description}</p>
                  <small>${author} - ${source}</small> - 
                  <small>${publishedAt}</small>
                </a>`
                //This variable is for news articles where Author is null, so it doesn't display the author
                  const newsNoAuthor = `
                  <div class="list-group">
                <a href="${url}" class="list-group-item list-group-item-action flex-column align-items-start ">
                <img src=${image} alt="News Image" style="height:50%; width:100%;" />
                  <div class="d-flex w-100 justify-content-between">
                  
                    <h5 class="mb-1">${title}</h5>
                  </div>
                  <p class="mb-1">${description}</p>
                  <small>${source}</small> - 
                  <small>${publishedAt}</small>
                </a>
                  `
                 
                //If the news articles returned do not contain a image, they will not be displayed in the news modal
                if (image === null){
                  continue
                } 
                          
                //Attaching and removing the news to the news container div. 
                if (author !== null){
                var news = $('#containerNewsInfo').append(newsNoAuthor)
                } else {
                  var news = $('#containerNewsInfo').append(newstotal)
                }

                  if (news){
                    map.on('click', function(){
                      $('#containerNewsInfo').empty();
                    })
                  } 
                }
                catch(err){
                  //If there is no news available, we can show a message saying there is no news available and to select another country
                var news = $('#containerNewsInfo').append('There is no news available for this selected country. Please choose another country')
                if (news){
                  map.on('click', function(){
                    $('#containerNewsInfo').empty(); 
                  })
                 break; 
                }
                }                    
              }     
            },
            error: function(error){
              console.log(error)   
            }
          })  
          
         
          //AJAX call to get country information
          $.ajax({
            url: './libs/php/getCountryInfo.php',
            type: 'POST',
            dataType: "json",
            data: {
              country: countrycode
            },
        
            success: function(result){
            //Creating variables here that can be used in other AJAX calls and putting data retrieved here onto the Country Info DIV
            console.log(result)
            const capital = result.data[0].capital;
            const country = result.data[0].countryName;
            

            $('.countryCode').html(result["data"][0]["countryCode"])
            $('.isoAlpha3').html(result["data"][0]["isoAlpha3"])
            $('.txtcapital').html(result["data"][0]["capital"]);
            $('.txtcountryName').html(result["data"][0]["countryName"]);
            $("#txtpopulation").html(result["data"][0]["population"]);
            $("#txtarea").html(result["data"][0]["areaInSqKm"]);
            const wiki = `https://en.wikipedia.org/wiki/${country}`
              document.getElementById("link2").setAttribute("href", `https://en.wikipedia.org/wiki/${country}`)
           
  

            // Using the getRestCountries API to retrieve more data
            let alpha3 = result.data[0].isoAlpha3
            let alpha3lower = alpha3.toLowerCase()
            

            //This ajax call is to make the country information modal display the countries borders with the name of the country and the flag
            $.ajax({
              url: './libs/php/getRestCountries.php',
              type: "POST",
              dataType: "json",
              data: {
                countrycode: alpha3lower
              },
              success: function(result){  
                //retrieving more data             
                const currencycode = result.data.currencies[0].code;              
                let flagurl = result.data.flag
                
                $(".currencysymbol").html(result["data"]["currencies"][0]["symbol"])
                $("#txtcurrency").html(result["data"]["currencies"][0]["name"])
                $(".flagurl").attr("src", flagurl, result)
                $("#demonym").html(result["data"]["demonym"])
                $("#language").html(result["data"]["languages"][0]["name"])
                $("#borders").html(result["data"]["borders"])
                $("#subregion").html(result["data"]["subregion"])
                let borders = result.data.borders;
                


                $.ajax({
                  url: './libs/php/getCountryBorders.php',
                  type: "GET",
                  dataType: "json",
                success:function(res){
                 
                  for (let i = 0; i < res.data.features.length; i++){
                  const isoa3 = res.data.features[i].properties.iso_a3
                   for (let j = 0; j < borders.length; j++){
                     if (isoa3 === result.data.borders[j]){
                       
                      const a3 = res.data.features[i].properties.iso_a3
                     
                       $.ajax({
                        url: './libs/php/getRestCountries.php',
                        type: "POST",
                        dataType: "json",
                        data: {
                          countrycode: a3
                        },
                        success: function(result){  
                         
                          
                            $("#bordersFullName").html(res["data"]["features"][i]["properties"]["name"])
                           const bordercountry = res.data.features[i].properties.name
                            var table = document.getElementById('bordertable')
                          var flag = result.data.flag
                         
                            var row = `<tr>
                             <td>${bordercountry}</td><td><img src=${flag} style="width:60px;height:40px;"></td>
                            </tr>`
                            table.innerHTML += row; 

                        },
                        error: function(error){
                          console.log(error)
                        }
                      })
                      
                      map.on('click', function(){
                        $('#bordertable').empty();
                      })
                    
                   }

                  }

                  }

                   
                    
                  
                },
                error: function(error){
                  console.log(error)
                }
              })
                
      
          
                
                //Using the data.fixer API to get currency for a given currency to euro's.
                $.ajax({
                  url: 'libs/php/getEuroCurrency.php',
                  type: 'POST',
                  data: 'JSON',
                  success: function(result){
                    //Adding the currency exchange rate for 1 Euro
                    const currency = result.data.rates[currencycode]
                    //Adding and removing when a new country is clicked
                    let update = $('#currencyToEuro').append(currency)
                      if (update){
                        map.on('click', function(){
                          $('#currencyToEuro').empty();
                        })
                      }
                  },
                  error: function(error){
                    console.log(error)
                  }
                })
                
                /*
                //Using the getExchangeRates api to get currency for a given currency for US dollars. API call commented out because I have run out of available API calls. 
                $.ajax({
                  url: './libs/php/getExchangeRates.php',
                  type: 'POST',
                  dataType: 'json',
                  data: {
                    symbols: currencycode
                  },
                  success: function(result){
                    const currencytodollar = result.data.rates[currencycode];
                    $("#exchangeRate").html(result['data']['rates'][currencycode]);
                  },
                  error: function(error){
                    console.log(error);
                  }
                
                })*/
              },
              error: function(error){
                console.log(error)
              }
            })
            
           // AJAX call for retrieving Weather information, using the capital variable declared in the getcountryInfo AJAX call
            $.ajax({
              url: './libs/php/getWeatherDiv.php',
              type: 'POST',
              dataType: "json",
              data: {
                q: capital
              },
              success: function(result){
              //Adding data retrieved from this API to HTML 
                $('.weathermaindiv').html(result['data']['weather'][0]['main']);
                $('.weatherdescdiv').html(result['data']['weather'][0]['description']);
                $('.txthumiditydiv').html(result['data']['main']['humidity'])
                $('.txttemperaturediv').html(result['data']['main']['temp'])
                $('.feelslikediv').html(result['data']['main']['feels_like']);
                $('.tempmaxdiv').html(result['data']['main']['temp_max']);
                $('.tempmindiv').html(result['data']['main']['temp_min']);
              },
              error: function(error){
                console.log(error)
              }
            })
            
            },
            //Error function for the getCountryInfo API 
          error: function(error){
            console.log(error)
          }
            
        })
      },
      //Error function for the openCageData API 
      error: function(error){
        console.log(error)
      }
    
    })

  
    // AJAX call for the timezone API, using the from the given click to give the weather information for that particular coordinate on the map
    $.ajax({
        url: "./libs/php/getTimezone.php",
        type: 'POST',
        dataType: 'json',
        data: {
            lat: lat,
            lng: lng,     
        },
        success: function(result) {
          $('.txttime').html(result['data']['time']);
          $('#txtsunrise').html(result['data']['sunrise'])
          $('#txtsunset').html(result['data']['sunset'])
          $('#txttimezoneId').html(result['data']['timezoneId'])
        },
        error: function(error) {
            console.log(error)
        }
    });
  });
};


//Using a ajax call to populate the select menu

$.fn.selectMenu = function(){
  $.ajax({
    url: 'libs/php/getCountryBorders.php',
    type: 'GET',
    dataType: "JSON",
    success: function(result){
     
      
      const select = document.getElementById('countries')
      for (let j = 0; j < result.data.features.length; j++){
        const element = document.createElement('option');
        const countryName = result.data.features[j].properties.name;
        const selectValue = result.data.features[j].properties.iso_a2;
        element.textContent = countryName;
        element.value = selectValue
        select.appendChild(element);
        
      }
     
    },
    error: function(error){
      console.log(error)
    }
  })

}




// function for using the nav bar select
$('#countryselect').change(function(){
    
  if (marker){
    map.removeLayer(marker)
  }

  //Using the value of the country selected in the select bar to the retrieve the border data from the countryBorders.geo.json file 
    $.ajax({
        url: 'libs/php/getCountryBorders.php',
        type: "POST",
        dataType: "JSON",
        success: function(result){    
    
          let val = $('#countryselect').val()

          for (let i = 0; i < result.data.features.length; i++){
            const bordercode = result.data.features[i].properties.iso_a2;
            
              let outline = result.data.features[i]; 
               
            if (val === bordercode){  
               
              var myLayer = L.geoJSON(outline).addTo(map) 
                if (myLayer){
                  $('#countryselect').change(function(){
                    myLayer.clearLayers();
                  })
                  map.on('click', function(){
                    myLayer.clearLayers();
                    
                  })    
                }  
            map.flyToBounds(myLayer.getBounds(), {"duration":1.25})
              

          // Retrieving the covid data using the select menu
            $.ajax({
              url: "libs/php/getCovidData.php",
              type: 'GET',
              dataType: 'json',
              success: function(res){
             
              for (let i = 0; i < res.data.length; i++){
                const code = res.data[i].code
  
                if (code === bordercode){
                  
                  $('#countryNameCovid').html(res['data'][i]['name'])
                  $('#confirmedCovid').html(res['data'][i]['latest_data']['confirmed'])
                  $('#criticalCovid').html(res['data'][i]['latest_data']['critical'])
                  $('#deathsCovid').html(res['data'][i]['latest_data']['deaths'])
                  $('#covidCasesPerMil').html(res['data'][i]['latest_data']['calculated']['cases_per_million_population'])
                  $('#recoveredCovid').html(res['data'][i]['latest_data']['recovered'])
                  $('#deathRateCovid').html(res['data'][i]['latest_data']['calculated']['death_rate'])
                  $('#recoveredCovid').html(res['data'][i]['latest_data']['calculated']['recovered'])
                  $('#recoveryRateCovid').html(res['data'][i]['latest_data']['calculated']['recovery_rate'])
                  
  
  
                  $('#todayConfirmedCovid').html(res['data'][i]['today']['confirmed'])
                  $('#todayDeathsCovid').html(res['data'][i]['today']['deaths'])
                  $('#updatedAt').html(res['data'][i]['updated_at'])
                }
              }
                
              },
              error: function(error){
                console.log(error)
              }
            })

            //placing the city markers 
          $.ajax({
            url: 'libs/php/getCityMarkers.php',
            type: 'POST',
            dataType: "JSON",
            success: function(result){
            var marker = L.marker();
            var markers = L.featureGroup(); 
          
   
            // adding and removing the markers that have been selected using the country select wth either another select option or clicking on the map 
            if(markers){
              $('#countryselect').change(function(){
                markers.eachLayer(function(layer){
                  markers.removeLayer(layer)
                })
              })
              map.on('click', function(){
                markers.eachLayer(function(layer){
                  markers.removeLayer(layer)
                })
              })
            }

              for (let i = 0; i < result.data.length; i++){
              const code = result.data[i].iso2
                
              if (code === val){ 

              let markerlat = result.data[i].lat 
              let markerlng = result.data[i].lng
                 
              const city = result.data[i].city
              const cityPop = result.data[i].population
              const cityWiki = city.split(" ").join("_")
              //creating the marker information and determining if a marker is a capital city
              if(result.data[i].capital === "primary"){
                marker = L.marker([markerlat, markerlng],{
                  icon:redIcon
                }).bindPopup(`
                <h6>${city} - Capital</h6>
                    <b>Latitude:</b> ${markerlat}, 
                    </br><b>Longitude: </b> ${markerlng}
                    </br><b>Time: </b><span id=time></span>
                    </br><b>Population:</b> ${cityPop}
                    </br><a href='https://en.wikipedia.org/wiki/${cityWiki}' target=_blank >Wikipedia</a>
                    <hr>
                    <h6>Weather</h6>
                     <b>Weather:</b> <span class=weathermain></span> - <span class=weatherdesc></span>
                     </br><b>Temperature: </b><span class=txttemp></span></br> <b>Feels like:</b> <span class=feelslike></span>
                     </br><b>Temp max: </b><span class=tempmax></span></br> <b>Temp min: </b><span class=tempmin></span>
                     </br> <b>Humidity: </b><span class=txthumidity></span></p>
                `)
              } else{
                marker = L.marker([markerlat, markerlng]).bindPopup(`
                                     <h6>${city}</h6>
                     <b>Latitude:</b> ${markerlat}, 
                     </br><b>Longitude: </b> ${markerlng}
                     </br><b>Time: </b><span id=time></span>
                     </br><b>Population:</b> ${cityPop}
                     </br><a href=https://en.wikipedia.org/wiki/${cityWiki} target=_blank >Wikipedia</a>
                     <hr>
                     <h6>Weather</h6>
                      <b>Weather:</b> <span class=weathermain></span> - <span class=weatherdesc></span>
                      </br><b>Temperature: </b><span class=txttemp></span></br> <b>Feels like:</b> <span class=feelslike></span>
                      </br><b>Temp max: </b><span class=tempmax></span></br><b> Temp min: </b><span class=tempmin></span>
                      </br> <b>Humidity: </b><span class=txthumidity></span></p>
                `)
              }
              
              markers.on('mouseover', function(e){
                let lat = e.latlng.lat;
                let lng = e.latlng.lng;
                let latlng = `${lat},${lng}`;
                
                // Getting the timezone placed on each individual marker 
                $.ajax({
                  url: 'libs/php/getTimezone.php',
                  type: 'GET',
                  dataType: "JSON",
                  data: {
                    lat: lat,
                    lng: lng
                  },
                  success: function(result){
                    
                    $('#time').html(result['data']['time'])
                    
                  }
                })
              })
              //Making a ajax call when the mouse is hovered over a marker to retrieve weather information for each individual marker 
              marker.on('mouseover', function(){
                $.ajax({
                  url: './libs/php/getWeather.php',
                  type: 'GET',
                  dataType: "json",
                  data: {
                    lati: markerlat,
                    lngi: markerlng
                  },
                  success: function(result){
                    
                  //Adding data retrieved from this API to HTML 
                  
                    $('.weathermain').html(result['data']['weather'][0]['main']);
                    $('.weatherdesc').html(result['data']['weather'][0]['description']);
                    $('.txthumidity').html(result['data']['main']['humidity'])
                    $('.txttemp').html(result['data']['main']['temp'])
                    $('.feelslike').html(result['data']['main']['feels_like']);
                    $('.tempmax').html(result['data']['main']['temp_max']);
                    $('.tempmin').html(result['data']['main']['temp_min']);
                    

                    
                  },
                  
                  error: function(error){
                    console.log(error)
                  }
                })

                                    
              })
              
              markers.addLayer(marker)
              markers.addTo(map)
              }
            marker.on('mouseover', function(){
              this.openPopup();
            })
 

            }
          
            },
            error:function(error){
              console.log(error)
            }
          })  
        

          //Here is about populating information to the divs 

          
          // Using data retrieved from the result of the country select to retrieve national holiday data 
            $.ajax({
              url: 'libs/php/getNationalHolidays.php',
              type: 'GET',
              dataType: "JSON",
              data: {
                country: bordercode
              },
              success: function(result){
              //Using a for loop to retrieve the holidays from a given bordercode from the countryBorders.geo.json file. 
                const holiday = result.data.holidays
                for (let i = 0; i < holiday.length; i++){
                  const holidayname = result.data.holidays[i].name;
                const holidaydate = result.data.holidays[i].date;
                var table = document.getElementById('holidayTable')
                var row = `<tr>
                <td>${holidayname}</td><td>${holidaydate}</td>
                </tr>`
                table.innerHTML += row;
                  
                if (row){
                  $('#countryselect').change(function(){
                    $('#holidayTable').empty();
                  })
                }
              }
                  
              },
              error: function(error){
                console.log(error)
              }
            })
            
           
            
            //AJAX call to retrieve data from the news API 
            $.ajax({
            url: "libs/php/getNews.php",
            type: 'GET',
            dataType: 'JSON',
            data: {
              'country': bordercode,  
            },
            success: function(result){
               //looping though the data to retrieve the 4 latest news articles available from the API   
              console.log(result)
              for (let i = 0; i < 10; i++){
                try{
                  
                const author = result.data.articles[i].author
                const title = result.data.articles[i].title
                const description = result.data.articles[i].description
                const url = result.data.articles[i].url
                const image = result.data.articles[i].urlToImage
                const publishedAt = result.data.articles[i].publishedAt
                const source = result.data.articles[i].source.name
               
                const newstotal = `
                <div class="list-group" >
                <a href="${url}" class="list-group-item list-group-item-action flex-column align-items-start ">
                <img src=${image} alt="News Image" style="height:50%; width:100%;" />
                  <div class="d-flex w-100 justify-content-between">
                  
                    <h5 class="mb-1">${title}</h5>
                  </div>
                  <p class="mb-1">${description}</p>
                  <small>${author} - ${source}</small> - 
                  <small>${publishedAt}</small>
                </a>`
                  const newsNoAuthor = `
                  <div class="list-group">
                <a href="${url}" class="list-group-item list-group-item-action flex-column align-items-start ">
                <img src=${image} alt="News Image" style="height:50%; width:100%;" />
                  <div class="d-flex w-100 justify-content-between">
                  
                    <h5 class="mb-1">${title}</h5>
                  </div>
                  <p class="mb-1">${description}</p>
                  <small>${source}</small> - 
                  <small>${publishedAt}</small>
                </a>
                  `
                 
                if (image === null){
                  continue
                } 
                  
                //Attaching and removing the news to the news container div. 
                if (author !== null){
                var news = $('#containerNewsInfo').append(newsNoAuthor)
                } else {
                  var news = $('#containerNewsInfo').append(newstotal)
                }

                  if (news){
                    $('#countryselect').change(function(){
                      $('#containerNewsInfo').empty();
                    })
                  } 
                }
                catch(err){
                var news = $('#containerNewsInfo').append('There is no news available for this selected country. Please choose another country')
                if (news){
                  $('#countryselect').change(function(){
                    $('#containerNewsInfo').empty(); 
                  })
                 break; 
                }
                }                    
              }     
            },
            //Error function for the news AJAX call
            error: function(error){
              error = "There is no available news for this selected country"
              console.log(error)     
            }
          })  
               
      


          //AJAX call for the countryInfo API, and using the data retrieved from this call for future AJAX calls
          $.ajax({
            url: "./libs/php/getCountryInfo.php",
            type: "POST",
            dataType: "JSON",
            data: {
              country: bordercode
            },
            success: function(result){  
            
              const capital = result.data[0].capital;
              const country = result.data[0].countryName
              $('.txtcountry').html(result['data'][0]['country'])
              $('.txtcapital').html(result['data'][0]['capital'])
       
              //AJAX call using the capitalcities API, using the capital city retrieved from the selected country used for the CountryInfo API
              $.ajax({
                url: "libs/php/getCapitalCities.php",
                type: "GET",
                dataType: "JSON",
                success: function(result){
                  console.log(result.data)
                  //Using the coordinates retrieved from the capitalCities API to place a marker on the capital city of a given country
                  for (let i = 0; i < result.data.length; i++){
                    if (result.data[i].CapitalName === capital){
                      const lat = result.data[i].CapitalLatitude
                      const lng = result.data[i].CapitalLongitude;
                      const latLng = lat + ','+ lng;
                      const marker = L.marker([lat, lng]);
                      
                      //Using a if statement to add new marker and remove the previous marker
                      if (marker){
                        $('#countryselect').change(function(){
                          map.removeLayer(marker);
                          map.removeLayer(popup)
                        })
                          map.on('click', function(){
                            map.removeLayer(marker);
                        })  
                      }

                      //AJAX call to retrieve Timezone data from the Timezone API
                      $.ajax({
                        url: "./libs/php/getTimezone.php",
                        type: 'POST',
                        dataType: 'json',
                        data: {
                            lat: lat,
                            lng: lng,     
                        },
                        success: function(result) {
                          //Adding the retrieved timezone data to the HTML document
                                $('.txttime').html(result['data']['time']);
                                $('#txtsunrise').html(result['data']['sunrise'])
                                $('#txtsunset').html(result['data']['sunset'])
                                $('#txttimezoneId').html(result['data']['timezoneId'])                      
                        },
                        error: function(error) {
                            console.log(error)
                        }
                      });
                    
                      //AJAX call to opencagedata API to retrieve the continent and countrycode of a selected country
                      $.ajax({
                        url: 'libs/php/getOpenCage.php',
                        type: 'GET',
                        dataType: 'json',
                        data: {
                          'key': '4bf6c8977b574b13989a6f8607c716e3',
                          'q': latLng,
                          'no_annotations': 1
                        },
                          success: function(response){     
                          console.log(response)
                            $('.continent').html(response['data']['results'][0]['components']['continent']);
                            
                        },
                        error:function(error){
                          console.log(error)
                        }
                      }) 
                    }
                  //End of the if statement from the success of the capitalCities AJAX call 
                  } 
                },
                // Error function for the capitalCities.json AJAX call 
                error: function(error){
                  console.log(error)
                }
              }) 
              
              //AJAX call for the getCountryInfo API
              $.ajax({
                url: './libs/php/getCountryInfo.php',
                type: 'POST',
                dataType: "json",
                data: {
                  country: bordercode
                },
                success: function(result){
            
                  //Creating variables to be used for future API calls and sending data to the HTML document
                  const capital = result.data[0].capital;
                  const country = result.data[0].countryName;
                  $('.txtcapital').html(result["data"][0]["capital"]);
                  $('.txtcountryName').html(result["data"][0]["countryName"]);
                  $('.countryCode').html(result["data"][0]["countryCode"])
                  $('.isoAlpha3').html(result["data"][0]["isoAlpha3"])
                  $("#txtpopulation").html(result["data"][0]["population"]);
                  $("#txtarea").html(result["data"][0]["areaInSqKm"]);
                  
                  let alpha3 = result.data[0].isoAlpha3
            
                  let alpha3lower = alpha3.toLowerCase()
                  
                  //AJAX call to retrieve data form the getRestCountries API 
                  $.ajax({
                    url: './libs/php/getRestCountries.php',
                    type: "POST",
                    dataType: "json",
                    data: {
                      countrycode: alpha3lower
                    },
                    success: function(result){
                      let flagurl = result.data.flag
                      const currencycode = result.data.currencies[0].code; 
                      $("#currencysymbol").html(result["data"]["currencies"][0]["symbol"])
                      $("#txtcurrency").html(result["data"]["currencies"][0]["name"])
                      $(".flagurl").attr("src", flagurl, result)
                      $("#demonym").html(result["data"]["demonym"])
                      $("#language").html(result["data"]["languages"][0]["name"])
                      $("#borders").html(result["data"]["borders"])
                      $("#subregion").html(result["data"]["subregion"])
                      let borders = result.data.borders;
                      $.ajax({
                        url: './libs/php/getCountryBorders.php',
                        type: "GET",
                        dataType: "json",
                      success:function(res){
                      
                        for (let i = 0; i < res.data.features.length; i++){
                        const isoa3 = res.data.features[i].properties.iso_a3
                         for (let j = 0; j < borders.length; j++){
                           if (isoa3 === result.data.borders[j]){
                             
                            const a3 = res.data.features[i].properties.iso_a3
                         
                             $.ajax({
                              url: './libs/php/getRestCountries.php',
                              type: "POST",
                              dataType: "json",
                              data: {
                                countrycode: a3
                              },
                              success: function(result){  
                              
                               //this function is for the border flags to be displayed in the country information borders
      
                                  $("#bordersFullName").html(res["data"]["features"][i]["properties"]["name"])
                                 const bordercountry = res.data.features[i].properties.name
                                  var table = document.getElementById('bordertable')
                                var flag = result.data.flag
                               
                                  var row = `<tr>
                                   <td>${bordercountry}</td><td><img src=${flag} style="width:60px;height:40px;"></td>
                                  </tr>`
                                  table.innerHTML += row; 
      
                              },
                              error: function(error){
                                console.log(error)
                              }
                            })
                            
                            $('#countryselect').change(function(){
                              $('#bordertable').empty();
                            })
                            map.on('click', function(){
                              $("#bordertable").empty();
                            })
                          
                         }
      
                        }
      
                        }                  
                      },
                      error: function(error){
                        console.log(error)
                      }
                    })
                      

                      /*
                     //AJAX call for getExchangeRates, commented out because I've run out of available API calls 
                      $.ajax({
                        url: './libs/php/getExchangeRates.php',
                        type: 'POST',
                        dataType: 'json',
                        data: {
                          symbols: currencycode
                        },
                        success: function(result){
                         
                          const currencytodollar = result.data.rates[currencycode];
                          
                          $("#exchangeRate").html(result['data']['rates'][currencycode]);
                        },
                        error: function(error){
                          console.log(error);
                        }
                      })
                    */
                      
                      //AJAX call for the currency exhange from a given country to Euros
                      $.ajax({
                        url: 'libs/php/getEuroCurrency.php',
                        type: 'POST',
                        data: 'JSON',
                        success: function(result){
                        
                          const currency = result.data.rates[currencycode]
                          //Attaching and removinng the given currency when a new currency is clicked
                          let update = $('#currencyToEuro').append(currency)
                            if (update){
                              $('#countryselect').change(function(){
                                $('#currencyToEuro').empty();
                              })
                            }
                          },
                          error: function(error){
                            console.log(error)
                          }
                        })    
                                
                      //AJAX call for the getWeather API 
                      
                      $.ajax({
                        url: './libs/php/getWeatherDiv.php',
                        type: 'POST',
                        dataType: "json",
                        data: {
                          q: capital
                        },
                        success: function(result){
                        
                          $('.weatherdiv').html(result['data']['weather'][0]['main']);
                          $('.weatherdescdiv').html(result['data']['weather'][0]['description']);
                          $('.txthumiditydiv').html(result['data']['main']['humidity'])
                          $('.txttemperaturediv').html(result['data']['main']['temp'])
                          $('.feelslikediv').html(result['data']['main']['feels_like']);
                          $('.tempmaxdiv').html(result['data']['main']['temp_max']);
                          $('.tempmindiv').html(result['data']['main']['temp_min']);
                        },
                        error: function(error){
                          console.log(error)
                        }
                      })
                    },
                    //Error function for the getRestCountries API 
                    error: function(error){
                      console.log(error)
                    }
                  })
                },
                
                error: function(error){
                  console.log(error)
                }
              })
            },
            //Error function for the getCountryInfo API 
            error: function(error){
              console.log(error);
            }
        }) 
      }
    }      
  },
  //Error funtion for the select CountryBorders.geo.json file 
  error:function(error){
    console.log(error)
  }
        
})

})


$('#map').myfunction();
$('#countryselect').selectMenu();