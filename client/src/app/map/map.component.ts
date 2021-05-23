import { environment } from '../../environments/environment';
import { Component, OnInit } from '@angular/core';
import * as mapboxgl from 'mapbox-gl';
import { AppService } from '../app.service';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit {
  map_data:any;
  map: any;
  marker: any;
  style = 'mapbox://styles/mapbox/streets-v11';
  lat = 37.7795436;
  lng = -122.4066264;
  legends = "RED color : beacon reference - BLACK color : GPS data";

  // init var to be displayed into the side block of the map
  survey_id = "";
  beacon_id = "";
  source = "";
  x = "";
  y = "";
  z = "";
  latitude: any;
  longitude: any;
  height = "";
  status = "";
  x_variance = "";
  y_variance = "";
  z_variance = "";
  variance = "";
  obs_total = "";
  obs_used = "";
  start_time:any;
  end_time:any;
  created_at:any;

  //stats survey infos
  beacon_id_infos = "";
  survey_complete_count_infos = "";
  survey_error_count_infos = "";
  opus_rapid_count_infos = "";
  opus_static_count_infos = "";
  number_survey_infos = "";

  // beacon ref
  beacon_id_ref = "";
  x_ref = "";
  y_ref = "";
  z_ref = "";
  latitude_ref: any;
  longitude_ref: any;
  height_ref = "";

  constructor(private appService: AppService) {
    this.map = mapboxgl.Map;
    this.marker = mapboxgl.Marker;
  }

  ngOnInit() {

    this.appService.getData().subscribe(data => {
      this.map_data = data;
    });

    this.map = new mapboxgl.Map({
      accessToken: environment.mapbox.accessToken,
      container: 'map',
      style: this.style,
      zoom: 12,
      center: [this.lng, this.lat],
      attributionControl: false,
    });

    // Add map marker
    this.marker = new mapboxgl.Marker({color:"#FF0000"})
    .setLngLat( [this.lng, this.lat])
    .addTo(this.map);

    // Add map controls
    this.map.addControl(new mapboxgl.NavigationControl({
      showZoom: true,
      showCompass: false,
      visualizePitch: false,
    }));
  }

  getBeaconData() {
    // remove marker
    this.marker.remove();

    if (this.map.getLayer("beacons_data-viz"))
      this.map.removeLayer("beacons_data-viz");
    if (this.map.getLayer("beacons_data_ref-viz"))
      this.map.removeLayer("beacons_data_ref-viz");

    if (this.map.getSource("beacons_data"))
      this.map.removeSource("beacons_data");
    if (this.map.getSource("beacons_data_ref"))
      this.map.removeSource("beacons_data_ref");

    // set serveys infos in the informations block
    this.beacon_id_infos = this.map_data.infos.beacon_id;
    this.survey_complete_count_infos = this.map_data.infos.survey_complete_count;
    this.survey_error_count_infos = this.map_data.infos.survey_error_count;
    this.opus_rapid_count_infos = this.map_data.infos.opus_rapid_count;
    this.opus_static_count_infos = this.map_data.infos.opus_static_count;
    this.number_survey_infos = this.map_data.infos.number_survey;
    
    // add the data from the beacon referer
    this.map.addSource('beacons_data', {
      "type": "geojson",
      "data": this.map_data.survey_results,
      "generateId": true,
    });

    // config the visual of the beacon referer on the map
    this.map.addLayer({
      'id': 'beacons_data-viz',
      'type': 'circle',
      'source': 'beacons_data',
      'paint': {
        'circle-stroke-color': "#000", //'#FF0000',
        'circle-stroke-width': 10,
        'circle-color': "#000"
      },
    });

    // set the surveys data into the side block of the map
    this.map.on('mousemove', 'beacons_data-viz', (event: { features: { properties: { 
      survey_id: string, beacon_id: string, source: string, x: any, y: any, z: any, latitude: any,
      longitude: any,height: any,status: string,x_variance: any,y_variance: any,z_variance: any,variance: any,
      obs_total: string,obs_used: string,start_time: string | number | Date,end_time: string | number | Date, created_at: string | number | Date
    }, geometry: {
      coordinates:{
        latitude:any,
        longitude:any,
      }[]
    } }[]; }) => {
      this.map.getCanvas().style.cursor = 'pointer';

      if ( event.features.length > 0) {
        this.survey_id = event.features[0].properties.survey_id;
        this.beacon_id = event.features[0].properties.beacon_id;
        this.source = event.features[0].properties.source;
        this.x = event.features[0].properties.x;
        this.y = event.features[0].properties.y;
        this.z = event.features[0].properties.z;
        this.latitude = event.features[0].geometry.coordinates[1]; // latitude;
        this.longitude = event.features[0].geometry.coordinates[0]; // longitude;
        this.height = event.features[0].properties.height;
        this.status = event.features[0].properties.status;
        this.x_variance = event.features[0].properties.x_variance;
        this.y_variance = event.features[0].properties.y_variance;
        this.z_variance = event.features[0].properties.z_variance;
        this.variance = event.features[0].properties.variance;
        this.obs_total = event.features[0].properties.obs_total;
        this.obs_used = event.features[0].properties.obs_used;
        this.start_time = new Date(event.features[0].properties.start_time);
        this.end_time = new Date(event.features[0].properties.end_time);
        this.created_at = new Date(event.features[0].properties.created_at);

      }
    });

    // When the mouse leaves the beacons_data-viz layer, update the
    // feature state of the previously hovered feature
    this.map.on('mouseleave', 'beacons_data-viz', () => {
      
      // Remove the information from the previously hovered feature from the sidebar
      this.survey_id = "";
      this.beacon_id = "";
      this.source = "";
      this.x = "";
      this.y = "";
      this.z = "";
      this.latitude = "";
      this.longitude = "";
      this.height = "";
      this.status = "";
      this.x_variance = "";
      this.y_variance = "";
      this.z_variance = "";
      this.variance = "";
      this.obs_total = "";
      this.obs_used = "";
      this.start_time = "";
      this.end_time = "";
      this.created_at = "";

      // Reset the cursor style
      this.map.getCanvas().style.cursor = '';
    });

    // add the data from the beacon referer
    this.map.addSource('beacon_ref_data', {
      "type": "geojson",
      "data": this.map_data.position_ca,
      "generateId": true,
    });

    // config the visual of the beacon referer on the map
    this.map.addLayer({
      'id': 'beacon_ref_data-viz',
      'type': 'circle',
      'source': 'beacon_ref_data',
      'paint': {
        'circle-stroke-color': "#FF0000",
        'circle-stroke-width': 5,
        'circle-color': "#FF0000"
      },
    });

    // center the map to the coordonate of the beacon referer
    this.map.flyTo({center: this.map_data.position_ca.geometry.coordinates, zoom: 18});

    // set the referer data into the informations block
    this.beacon_id_ref = this.map_data.position_ca.properties.beacon_id;
    this.x_ref = this.map_data.position_ca.properties.x;
    this.y_ref = this.map_data.position_ca.properties.y;
    this.z_ref = this.map_data.position_ca.properties.z;
    this.latitude_ref = this.map_data.position_ca.geometry.coordinates[1];
    this.longitude_ref = this.map_data.position_ca.geometry.coordinates[0];
    this.height_ref = this.map_data.position_ca.properties.height;    

  }
  
}
