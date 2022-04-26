// imports
import { LightningElement, api, wire } from "lwc";
import getBoatsByLocation from '@salesforce/apex/BoatDataService.getBoatsByLocation';

const LABEL_YOU_ARE_HERE = 'You are here!';
const ICON_STANDARD_USER = 'standard:user';
const ERROR_TITLE = 'Error loading Boats Near Me';
const ERROR_VARIANT = 'error';
export default class BoatsNearMe extends LightningElement {
  @api boatTypeId;
  mapMarkers = [];
  isLoading = true;
  isRendered;
  latitude;
  longitude;
  
  // Add the wired method from the Apex Class
  // Name it getBoatsByLocation, and use latitude, longitude and boatTypeId
  // Handle the result and calls createMapMarkers
  @wire(getBoatsByLocation, { latitude: this.latitude, longitude: this.longitude, boatTypeId: '$boatTypeId' })
  wiredBoatsJSON({error, data}) { 
      if(data) {
        this.createMapMarkers(data);
      }
  }
  
  // Controls the isRendered property
  // Calls getLocationFromBrowser()
  renderedCallback() { }
  
  // Gets the location from the Browser
  // position => {latitude and longitude}
  getLocationFromBrowser() { }
  
  // Creates the map markers
  createMapMarkers(boatData) {
     const newMarkers = boatData.map(boat => {
         title: boat.title,
         location: {
             longitude: boat.longitude,
             latitude: boat.latitude
         }
     });
     
     newMarkers.unshift({
        title: boat.title,
        location: {
            longitude: this.longitude,
            latitude: this.latitude
        }
     });
   }
}