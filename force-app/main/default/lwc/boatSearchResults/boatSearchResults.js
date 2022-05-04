// ...
import { LightningElement, api, wire } from "lwc";
import { MessageContext, publish } from "lightning/messageService";
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import BOAT_OBJECT from '@salesforce/schema/Boat__c';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import getBoats from '@salesforce/apex/BoatDataService.getBoats';
import updateBoatList from '@salesforce/apex/BoatDataService.updateBoatList';
import BoatMC from '@salesforce/messageChannel/BoatMessageChannel__c';

const SUCCESS_TITLE = 'Success';
const MESSAGE_SHIP_IT     = 'Ship it!';
const SUCCESS_VARIANT     = 'success';
const ERROR_TITLE   = 'Error';
const ERROR_VARIANT = 'error';
export default class BoatSearchResults extends LightningElement {
  selectedBoatId;
  @api boatTypeId = '';
  @api boats;
  isLoading = false;

  @wire(getObjectInfo, { objectApiName: BOAT_OBJECT })
  boatInfo({ data, error }) {
    if(data) {
      return [
        { label: data.fields.Name.label, fieldName: 'Name', type: 'Text', editable: 'true' },
        { label: data.fields.Length__c.label, fieldName: 'Length__c', type: 'number', editable: 'true' },
        { label: data.fields.Price__c.label, fieldName: 'Price__c', type: 'currency', editable: 'true' },
        { label: data.fields.Description__c.label, fieldName: 'Description__c', type: 'text', editable: 'true' }
      ];
    }
  }

  columns = this.boatInfo();
  
  // wired message context
  @wire(MessageContext)
  messageContext;

  // wired getBoats method 
  @wire(getBoats, {boatTypeId: '$boatTypeId'})
  wiredBoats(result) {
    if(result) {
        this.boats = result;
    }
  }
  
  // public function that updates the existing boatTypeId property
  // uses notifyLoading
  @api
  searchBoats(boatTypeId) {
    this.isLoading = true;
    this.notifyLoading(this.isLoading);
    this.boatTypeId = boatTypeId;
  }
  
  // this public function must refresh the boats asynchronously
  // uses notifyLoading
  @api
  async refresh() {
    this.isLoading = true;
    this.notifyLoading(this.isLoading);
    await refreshApex(this.boats);
    this.isLoading = false;
    this.notifyLoading(this.isLoading);
  }
  
  // this function must update selectedBoatId and call sendMessageService
  updateSelectedTile(event) {
    this.selectedBoatId = event.detail.boatId;
    this.sendMessageService(this.selectedBoatId);
  }
  
  // Publishes the selected boat Id on the BoatMC.
  sendMessageService(boatId) {
    // explicitly pass boatId to the parameter recordId
    publish(this.messageContext, BoatMC, { recordId: boatId });
  }
  
  // The handleSave method must save the changes in the Boat Editor
  // passing the updated fields from draftValues to the 
  // Apex method updateBoatList(Object data).
  // Show a toast message with the title
  // clear lightning-datatable draft values
  handleSave(event) {
    // notify loading
    this.notifyLoading(true);

    const updatedFields = event.detail.draftValues;

    // Update the records via Apex
    updateBoatList({data: updatedFields})
    .then((res) => {
      this.dispatchEvent(
        new ShowToastEvent({
          title: SUCCESS_TITLE,
          message: MESSAGE_SHIP_IT,
          variant: SUCCESS_VARIANT
        })
      );
      this.draftValues = [];
      return this.refresh();
    })
    .catch(error => {
      this.dispatchEvent(
        new ShowToastEvent({
          title: ERROR_TITLE,
          message: error.body.message,
          variant: ERROR_VARIANT
        })
      );
      this.notifyLoading(false);
    })
    .finally(() => {
      this.draftValues = [];
    });
  }
  // Check the current value of isLoading before dispatching the doneloading or loading custom event
  notifyLoading(isLoading) {
    if(isLoading) {
      this.dispatchEvent(new CustomEvent('loading'));
    } else {
      this.dispatchEvent(new CustomEvent('doneloading'));
    }
  }
}
