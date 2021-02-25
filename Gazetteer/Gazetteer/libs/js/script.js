var map = L.map('map').setView([0,0], 2);

var Thunderforest_Landscape = L.tileLayer('https://{s}.tile.thunderforest.com/landscape/{z}/{x}/{y}.png?apikey={apikey}', {
	attribution: '&copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	apikey: '1eccea5134314562a5aa86cd7a01e8da',
	maxZoom: 22
}).addTo(map);

var popup = L.popup();


// Function for clicking on the map
$.fn.myfunction = function(){
    map.on('click', function(e){
        let lat = e.latlng.lat;
        let lng = e.latlng.lng;
        let latlng = `${lat},${lng}`
    
        
    
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
          $('.continent').html(response['data']["results"][0]["components"]["continent"]);
          
          $.ajax({
            url: 'libs/php/getCities.php',
            type: 'GET',
            dataType: 'JSON',
            success: function(result){
              
              

              for (let i = 0; i < result.data.features.length; i++){
              const IsoA2ForCity = result.data.features[i].properties.ISO_A2;
              const IsoA2 = IsoA2ForCity.toLowerCase();
              if (IsoA2 === countrycode){
              const cityMarkerCoords = result.data.features[i]
              const cityMarkerLat = result.data.features[i].properties.LATITUDE;
              const cityMarkerLng = result.data.features[i].properties.LONGITUDE;
              
              var marker = L.marker([cityMarkerLat, cityMarkerLng])  
              markers = L.layerGroup([marker]).addTo(map);     
               if (markers){
                 map.on('click', function(){
                   markers.clearLayers();
                 })
               } 
              }
            } 
          
          },
          error:function(error){
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
          /*
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
                const holidays = `<h4>${holidayname}</h4> <p>${holidaydate}</p>`;
                
                //Adding and removing previously added holidays
                var update = $('#containerHolidayInfo').append(holidays)
                  
                if (update){
                  map.on('click', function(){
                    $('#containerHolidayInfo').empty();
                  })
                }
              }
            },
            error: function(error){
              console.log(error)
            }
          })
          */
         
          //AJAX call to get the news from a given country
          $.ajax({
            url: "libs/php/getNews.php",
            type: 'GET',
            dataType: 'JSON',
            data: {
              'country': countrycode,
              
            },
            success: function(result){
              //Using a for loop to display the 4 most recent articles given from the API      
              for (let i = 0; i < 4; i++){
                
                const author = result.data.articles[i].author
                const title = result.data.articles[i].title
                const url = result.data.articles[i].url
                const newstotal = 
                `<h3>${title}.</h3> 
                <a href=${url} target="_blank">${url}</a>
                <p>By ${author}</p>`;
            
                //Displaying the news in the news Div
                var news = $('#containerNews').append(newstotal)
          
                if (news){
                  $('#btnRun').click(function(){
                    $('#containerNews').empty();
                  })
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
            const capital = result.data[0].capital;
            const country = result.data[0].countryName;
            $('.countryCode').html(result["data"][0]["countryCode"])
            $('.isoAlpha3').html(result["data"][0]["isoAlpha3"])
            $('.txtcapital').html(result["data"][0]["capital"]);
            $('.txtcountryName').html(result["data"][0]["countryName"]);
            $("#txtpopulation").html(result["data"][0]["population"]);
            $("#txtarea").html(result["data"][0]["areaInSqKm"]);
            const wiki = `https://en.wikipedia.org/wiki/${country}`
            $('a').attr('href', function(i, href) {
              return href + country
          });

            // AJAX call for the capital cities coordinates, used for a marker to show the location of the capital city when clicked. 
            $.ajax({
              url: 'libs/php/getCapitalCities.php',
              type: 'POST',
              dataType: "json",
              success: function(result){
                //Using a for loop to match the capital name in the result here from the capital found in the getCountryInfo API
                console.log(result)
                for (let i = 0; i < result.data.length; i++){
                  if (result.data[i].CapitalName === capital){
                    const capitalLat = result.data[i].CapitalLatitude;
                    const capitalLng = result.data[i].CapitalLongitude;
                    //Using the retrieved coordinates to place a marker, and add and remove the marker when a new marker is clicked. 
                    
                    var marker = L.marker([capitalLat, capitalLng])
                    marker.bindPopup(`${capital}`).openPopup();
                    marker.addTo(map)
                    
                    if (marker){
                      $('#countryselect').click(function(){
                        map.removeLayer(marker);
                        map.removeLayer(popup)
                      })
                        map.on('click', function(){
                          map.removeLayer(marker);
                      })
                    }
                }
                } 
              }
            })


            // Using the getRestCountries API to retrieve more data
            let alpha3 = result.data[0].isoAlpha3
            let alpha3lower = alpha3.toLowerCase()
            
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
                $("#currencysymbol").html(result["data"]["currencies"][0]["symbol"])
                $("#txtcurrency").html(result["data"]["currencies"][0]["name"])
                $(".flagurl").attr("src", flagurl, result)
                $("#demonym").html(result["data"]["demonym"])
                $("#language").html(result["data"]["languages"][0]["name"])
                $("#borders").html(result["data"]["borders"])
                $("#subregion").html(result["data"]["subregion"])
                /*
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
                */
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
              url: './libs/php/getWeather.php',
              type: 'POST',
              dataType: "json",
              data: {
                q: capital
              },
              success: function(result){
              //Adding data retrieved from this API to HTML 
                $('#weathermain').html(result['data']['weather'][0]['main']);
                $('#weatherdesc').html(result['data']['weather'][0]['description']);
                $('#txthumidity').html(result['data']['main']['humidity'])
                $('#txttemperature').html(result['data']['main']['temp'])
                $('#feelslike').html(result['data']['main']['feels_like']);
                $('#tempmax').html(result['data']['main']['temp_max']);
                $('#tempmin').html(result['data']['main']['temp_min']);
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
    //Setting a popup from where abouts you click on the country, and a flag will appear with Country name and name of capital city. Also a marker will appear of the location of the capital city. 
    popup
    .setLatLng(e.latlng)
    .setContent( `<img src="" class=flagurl style="width:100px;height:100px;" >` +
                 "</br>Country: <span class=txtcountryName></span>" +
                 "</br>Capital: <span class=txtcapital></span>")
    .openOn(map);
  
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

$.fn.selectMenu = function(){
  $.ajax({
    url: 'libs/php/getCountryBorders.php',
    type: 'POST',
    dataType: "JSON",
    success: function(result){
      console.log(result)
      
      const select = document.getElementById('countryselect')
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
                  const holidays = `<h4>${holidayname}</h4> <p>${holidaydate}</p>`;
                  //Attaching and removing the given holidays from the national holiday div when a country is selected
                  var update = $('#containerHolidayInfo').append(holidays)
                  if (update){
                    $('#countryselect').change(function(){
                      $('#containerHolidayInfo').empty();
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
              for (let i = 0; i < 4; i++){
                
                const author = result.data.articles[i].author
                const title = result.data.articles[i].title
                const url = result.data.articles[i].url
                const newstotal = 
                `<h3>${title}.</h3> 
                <a href=${url} target="_blank">${url}</a>
                <p>By ${author}</p>`;
            
                //Attaching and removing the news to the news container div.
                var news = $('#containerNews').append(newstotal)
                  if (news){
                    $('#countryselect').change(function(){
                      $('#containerNews').empty();
                    })
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
                      //Adding the marker and a popup with information retrieved onto the map
                      marker.addTo(map);  
                      marker.bindPopup(
                        `<img src="" class=flagurl style="width:100px;height:100px;" >` +
                        "</br>Country:" + country +
                        "</br>Capital:" + capital).openPopup();
                      
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
                          
                            $('.continent').html(response['data']['results'][0]['components']['continent']);
                            $('.countryCode').html(response['data']['results'][0]['components']['country_code'])  
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
                  $("#txtpopulation").html(result["data"][0]["population"]);
                  $("#txtarea").html(result["data"][0]["areaInSqKm"]);
                  
                  $('a').attr('href', function(i, href) {
                    return href + country
                  });
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
                      

                     /* /AJAX call for getExchangeRates, commented out because I've run out of available API calls 
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
                   /*
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
                        */                 
                      //AJAX call for the getWeather API 
                      
                      $.ajax({
                        url: './libs/php/getWeather.php',
                        type: 'POST',
                        dataType: "json",
                        data: {
                          q: capital
                        },
                        success: function(result){
                        
                          $('#weathermain').html(result['data']['weather'][0]['main']);
                          $('#weatherdesc').html(result['data']['weather'][0]['description']);
                          $('#txthumidity').html(result['data']['main']['humidity'])
                          $('#txttemperature').html(result['data']['main']['temp'])
                          $('#feelslike').html(result['data']['main']['feels_like']);
                          $('#tempmax').html(result['data']['main']['temp_max']);
                          $('#tempmin').html(result['data']['main']['temp_min']);
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

//Calling the functions to toggle the div's on the HTML document
$('#btnInfo').on('click', function(){
  $('#containerCountryInfo').toggle();
})
$('#btnWeather').on('click', function(){
  $('#containerWeather').toggle();
})
$('#btnNews').on('click', function(){
  $('#containerNewsInfo').toggle();
})
$('#btnHoliday').on('click', function(){
  $('#containerHolidayInfo').toggle();
})

$('#map').myfunction();
$('#countryselect').selectMenu();