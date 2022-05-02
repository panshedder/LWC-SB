// imports
import { LightningElement, api, wire, track } from "lwc";
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getBoatsByLocation from '@salesforce/apex/BoatDataService.getBoatsByLocation';

const LABEL_YOU_ARE_HERE = 'You are here!';
const ICON_STANDARD_USER = 'standard:user';
const ERROR_TITLE = 'Error loading Boats Near Me';
const ERROR_VARIANT = 'error';
export default class BoatsNearMe extends LightningElement {
  @api boatTypeId;
  @track mapMarkers = [];
  @track isLoading = true;
  @track isRendered;
  latitude;
  longitude;
  
  // Add the wired method from the Apex Class
  // Name it getBoatsByLocation, and use latitude, longitude and boatTypeId
  // Handle the result and calls createMapMarkers
  @wire(getBoatsByLocation, { latitude: '$latitude', longitude: '$longitude', boatTypeId: '$boatTypeId' })
  wiredBoatsJSON({error, data}) { 
      if(data) {
        this.createMapMarkers(data);
      } else if(error) {
        const event = new ShowToastEvent({
          title: ERROR_TITLE,
          message: error.body.message,
          variant: ERROR_VARIANT
        });
        this.dispatchEvent(event);
        this.isLoading = false;
      }
  }
  
  // Controls the isRendered property
  // Calls getLocationFromBrowser()
  renderedCallback() { 
    if(!this.isRendered) {
      this.getLocationFromBrowser();
      this.isRendered = true;
    }
  }
  
  // Gets the location from the Browser
  // position => {latitude and longitude}
  getLocationFromBrowser() {
    if(navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
        this.latitude = position.coords.latitude;
        this.longitude = position.coords.longitude;
      });
      this.isRendered = true;
    }
   }
  
  // Creates the map markers
  createMapMarkers(boatData) {

    this.mapMarkers = boatData.map(boat => {
      return {
        title: boat.Name,
        location: {
            Longitude: boat.Geolocation__Longitude__s,
            Latitude: boat.Geolocation__Latitude__s
        }
      };
    });
     
    this.mapMarkers.unshift({
      title: LABEL_YOU_ARE_HERE,
      icon: ICON_STANDARD_USER,
      location: {
          Longitude: this.longitude,
          Latitude: this.latitude
      }
    });
    this.isLoading = false;
  }
}