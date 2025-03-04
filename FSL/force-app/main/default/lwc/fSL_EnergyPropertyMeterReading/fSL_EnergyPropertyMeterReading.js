import { LightningElement, api, wire, track } from 'lwc';
import { getRecord, createRecord, updateRecord } from 'lightning/uiRecordApi';
import { getRelatedListRecords } from 'lightning/uiRelatedListApi';

const SA_FIELDS = [
    SA_NAME_FIELD,
    SA_WO_FIELD,
    SA_WO_LOCATION_FIELD,
    SA_WO_LOCATIONID_FIELD
];

const EPR_FIELDS = [
    NAME_FIELD,
    HEATINGPERIOD_FIELD,
    STATE_FIELD,
    ENERGYREADINGDATETIME_FIELD,
    PREVIOUSENERYPROPERTYREADING_FIELD,
    PREVIOUSENERYPROPERTYREADINGID_FIELD,
    METERCOMPLETE_FIELD,
    APE_FIELD,
    WORKORDERID_FIELD,
    LOCATION_FIELD,
    LOCATIONID_FIELD
];

/*const CURRENT_EPR_CREATE_FIELDS = [
    NAME_FIELD,
    HEATINGPERIOD_FIELD,
    STATE_FIELD,
    ENERGYREADINGDATETIME_FIELD,
    WORKORDER_FIELD,
    LOCATION_FIELD
];*/

const CURRENT_EPR_CREATE_FIELDS = [
    NAME_FIELD,
    HEATINGPERIOD_FIELD,
    STATE_FIELD,
    ENERGYREADINGDATETIME_FIELD
];

const CURRENT_EPR_EDIT_FIELDS = [
    NAME_FIELD,
    HEATINGPERIOD_FIELD,
    STATE_FIELD,
    ENERGYREADINGDATETIME_FIELD
];

const PREVIOUS_EPR_READ_FIELDS = [
    NAME_FIELD,
    STATE_FIELD,
    ENERGYREADINGDATETIME_FIELD,
    APE_FIELD
];

const EMR_FIELDS = [
    EMR_NAME_FIELD,
    EMR_ASSET_FIELD
];

// ServiceAppointment fields
import SA_NAME_FIELD from '@salesforce/schema/ServiceAppointment.AppointmentNumber';
import SA_WO_FIELD from '@salesforce/schema/ServiceAppointment.FSL_TECH_ParentWorkOrder__c';
import SA_WO_LOCATION_FIELD from '@salesforce/schema/ServiceAppointment.FSL_TECH_ParentWorkOrder__r.Location.Id';
import SA_WO_LOCATIONID_FIELD from '@salesforce/schema/ServiceAppointment.FSL_TECH_ParentWorkOrder__r.LocationId';

// Energy Property Reading object
import EPR_OBJECT from '@salesforce/schema/FSL_EnergyPropertyReading__c';

// Energy Property Reading fields
import NAME_FIELD from '@salesforce/schema/FSL_EnergyPropertyReading__c.Name';
import HEATINGPERIOD_FIELD from '@salesforce/schema/FSL_EnergyPropertyReading__c.FSL_HeatingPeriod__c';
import STATE_FIELD from '@salesforce/schema/FSL_EnergyPropertyReading__c.FSL_State__c';
import ENERGYREADINGDATETIME_FIELD from '@salesforce/schema/FSL_EnergyPropertyReading__c.FSL_EnergyReadingDateTime__c';
import PREVIOUSENERYPROPERTYREADING_FIELD from '@salesforce/schema/FSL_EnergyPropertyReading__c.FSL_PreviousEnergyPropertyReading__c';
import PREVIOUSENERYPROPERTYREADINGID_FIELD from '@salesforce/schema/FSL_EnergyPropertyReading__c.FSL_PreviousEnergyPropertyReading__r.Id';
import METERCOMPLETE_FIELD from '@salesforce/schema/FSL_EnergyPropertyReading__c.FSL_MeterComplete__c';
import APE_FIELD from '@salesforce/schema/FSL_EnergyPropertyReading__c.FSL_APE__c';
import WORKORDER_FIELD from '@salesforce/schema/FSL_EnergyPropertyReading__c.FSL_Intervention__c';
import WORKORDERID_FIELD from '@salesforce/schema/FSL_EnergyPropertyReading__c.FSL_Intervention__r.Id';
import LOCATION_FIELD from '@salesforce/schema/FSL_EnergyPropertyReading__c.FSL_InstallationGeographicalZone__c';
import LOCATIONID_FIELD from '@salesforce/schema/FSL_EnergyPropertyReading__c.FSL_InstallationGeographicalZone__r.Id';


// Energy Meter Reading fields
import EMR_NAME_FIELD from '@salesforce/schema/FSL_EnergyMeterReading__c.Name';
import EMR_ASSET_FIELD from '@salesforce/schema/FSL_EnergyMeterReading__c.FSL_Asset__c';



export default class FSL_EnergyPropertyMeterReading_lwc extends LightningElement {

    // Flexipage provides recordId and objectApiName
    @api recordId;
    @api objectApiName;

    // Expose a field to make it available in the template
    // Energy Property Reading
    eprObject = EPR_OBJECT;
    currentEPREditFields = CURRENT_EPR_EDIT_FIELDS;
    currentEPRCreateFields = CURRENT_EPR_CREATE_FIELDS;
    previousEPRReadFields = PREVIOUS_EPR_READ_FIELDS;
    emrFields = EMR_FIELDS;
    nameField = NAME_FIELD;
    heatingPeriodField = HEATINGPERIOD_FIELD;
    stateField = STATE_FIELD;
    energyReadingDateTimeField = ENERGYREADINGDATETIME_FIELD;
    previousEnergyPropertyReadingField = PREVIOUSENERYPROPERTYREADING_FIELD;
    previousEnergyPropertyReadingIdField = PREVIOUSENERYPROPERTYREADINGID_FIELD;
    meterCompleteField = METERCOMPLETE_FIELD;
    apeField = APE_FIELD;
    workOrderField = WORKORDER_FIELD;
    workOrderIdField = WORKORDERID_FIELD;
    locationField = LOCATION_FIELD;
    locationIdField = LOCATIONID_FIELD;

    woId = '';
    woRecord = null;
    locationId = '';
    locationRecord = null;
    currentLocationId = '';
    stateDefaultValue = 'REL';
    hasAssets = false;

    @track eprError;
    @track eprRecords = [];
    @track currentEPRRecords = [];
    @track currentEPRRecord = null;
    @track currentEnergyPropertyReadingId = null;
    @track previousEPRRecord = null;
    @track previousEnergyPropertyReadingId = '';
    @track isEditing = false;
    @track assetRecords = [];
    @track assetError;
    @track showCPTModal = false; 
    @track showSTKModal = false;
    @track selectedEquipmentType = '';
    @track assetMeterReadingsMap = new Map();
    @track existingMeterReadingId = null;
    @track existingStockReadingId = null;
    @track selectedAsset;



    @wire(getRecord, { recordId: "$recordId", fields: SA_FIELDS })
    serviceAppointment({ error, data }) {
        if (data) {
            console.log('serviceAppointment getRecord data: ' + JSON.stringify(data));
            //this.previousEnergyPropertyReadingId = data.fields.FSL_PreviousEnergyPropertyReading__c.value;
            //console.log('previousEnergyPropertyReadingId:' + this.previousEnergyPropertyReadingId);
            console.log('data.fields.FSL_TECH_ParentWorkOrder__r:' + JSON.stringify(data.fields.FSL_TECH_ParentWorkOrder__r));
            console.log('data.fields.FSL_TECH_ParentWorkOrder__r.value.fields.LocationId:' + JSON.stringify(data.fields.FSL_TECH_ParentWorkOrder__r.value.fields.LocationId));
            this.woId = data.fields.FSL_TECH_ParentWorkOrder__c.value;
            console.log('woId:' + this.woId);
            this.woRecord = data.fields.FSL_TECH_ParentWorkOrder__r.value;
            console.log('woRecord:' + JSON.stringify(this.woRecord));
            this.locationId = data.fields.FSL_TECH_ParentWorkOrder__r.value.fields.LocationId.value;
            this.currentLocationId = this.locationId;
            console.log('locationId:' + this.locationId);
            this.locationRecord = data.fields.FSL_TECH_ParentWorkOrder__r.value.fields.Location.value;
            console.log('locationRecord:' + JSON.stringify(this.locationRecord));
        }
        else if (error) {
            console.log('serviceAppointment getRecord error: ' + JSON.stringify(error));
        }
    }

    // Retrieving EPR records related to the location related to the related WO where WO Id is the same as the WO Id of the intervention
    // It means it is the current Energy Property Reading
    
    @wire(getRelatedListRecords, {
        //parentRecordId: '131G50000017HwPIAU',
        parentRecordId: '$currentLocationId',
        relatedListId: 'Energy_Property_Readings__r',
        //fields: EPR_FIELDS,
        fields: ['FSL_EnergyPropertyReading__c.Id', 'FSL_EnergyPropertyReading__c.Name', 'FSL_EnergyPropertyReading__c.FSL_State__c', 'FSL_EnergyPropertyReading__c.FSL_HeatingPeriod__c', 'FSL_EnergyPropertyReading__c.FSL_EnergyReadingDateTime__c', 'FSL_EnergyPropertyReading__c.FSL_MeterComplete__c', 'FSL_EnergyPropertyReading__c.FSL_APE__c', 'FSL_EnergyPropertyReading__c.FSL_Intervention__r.Id'],
        sortBy: ['-FSL_EnergyPropertyReading__c.FSL_EnergyReadingDateTime__c'],
    })
    currentEPRListInfo({ error, data }) {
        //console.log('whereCondition: '+this.whereCondition);
        console.log('currentLocationId: '+this.currentLocationId);
        if (data) {
            console.log('data.records.length: ' + data.records.length);
            console.log('Location current EPR getRelatedListRecords data: ' + JSON.stringify(data));
            this.currentEPRRecords = data.records.filter(record => {
                return record.fields.FSL_Intervention__r.value && record.fields.FSL_Intervention__r.value.fields.Id.value === this.woId;
            });
            console.log('currentEPRRecords: '+JSON.stringify(this.currentEPRRecords));
            if (this.currentEPRRecords.length > 0) { // We have found an EPR related to the same WO. We use it as the current EPR.
                console.log('this.currentEPRRecords.length > 0');
                this.currentEPRRecord = {
                    Id: this.currentEPRRecords[0].fields.Id.value,
                    Name: this.currentEPRRecords[0].fields.Name.value,
                    FSL_State__c: this.currentEPRRecords[0].fields.FSL_State__c.value,
                    FSL_HeatingPeriod__c: this.currentEPRRecords[0].fields.FSL_HeatingPeriod__c.value,
                    FSL_EnergyReadingDateTime__c: this.currentEPRRecords[0].fields.FSL_EnergyReadingDateTime__c.value,
                    FSL_MeterComplete__c: this.currentEPRRecords[0].fields.FSL_MeterComplete__c.value,
                    FSL_APE__c: this.currentEPRRecords[0].fields.FSL_APE__c.value,
                    FSL_PreviousEnergyPropertyReading__c: this.currentEPRRecords[0].fields.FSL_PreviousEnergyPropertyReading__c?.value || '',
                    FSL_InstallationGeographicalZone__c: this.currentEPRRecords[0].fields.FSL_InstallationGeographicalZone__c?.value || ''
                };
                this.currentEnergyPropertyReadingId = this.currentEPRRecord.Id;
                if (data.records.length > 1) { // We see if we have a second record linked to the same Location. This would be the previous EPR for the location.
                    console.log('data.records.length > 1');
                    this.previousEPRRecord = data.records[1];
                    this.previousEnergyPropertyReadingId = data.records[0].fields.Id.value;
                    console.log('previousEPRRecord: ' + JSON.stringify(this.previousEPRRecord));
                } else { // There is no previous EPR linked to the same Location.
                    console.log('data.records.length = 1');
                    this.previousEPRRecord = null;
                }
            }
            else { // No EPR linked to the same WO
                console.log('this.currentEPRRecords.length = 0');
                this.currentEPRRecord = null;
                this.currentEnergyPropertyReadingId = null;
                this.previousEPRRecord = data.records[0];
                this.previousEnergyPropertyReadingId = data.records[0].fields.Id.value;
            }
            console.log('currentEPRRecord: ' + JSON.stringify(this.currentEPRRecord));
            console.log('currentEnergyPropertyReadingId: ' + this.currentEnergyPropertyReadingId);
            console.log('previousEPRRecord: ' + JSON.stringify(this.previousEPRRecord));
            console.log('previousEnergyPropertyReadingId: ' + this.previousEnergyPropertyReadingId);
            this.eprError = undefined;
        } else if (error) {
            console.log('Location current EPR getRelatedListRecords error: ' + JSON.stringify(error));
            this.eprError = error;
            this.currentEPRRecords = undefined;
            //console.log('eprError: '+JSON.stringify(this.emrError));
        }
    }

    
    handleFieldChange(event) {
        const fieldName = event.target.fieldName;
        const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
        this.currentEPRRecord[fieldName] = value;
    }


    handleSave() {
        console.log('handleSave');
        console.log('handleSave - this.isEditing BEFORE: '+this.isEditing);
        this.isEditing = false;
        console.log('handleSave - this.isEditing AFTER: '+this.isEditing);
        
    }

    
    handleSubmit(event) {
        console.log('handleSubmit');
        console.log('event.detail.fields: '+JSON.stringify(event.detail.fields));
        event.preventDefault();       // stop the form from submitting
        this.isEditing = false;
        event.detail.fields.FSL_Intervention__c = this.woId;
        event.detail.fields.FSL_InstallationGeographicalZone__c = this.locationId;
        const fields = event.detail.fields;
        console.log('event.detail.fields AFTER: '+JSON.stringify(fields));
        console.log(JSON.stringify(fields));
        this.template.querySelector('lightning-record-edit-form').submit(fields);
     }
    

     handleSuccess(event) {
        console.log('handleSuccess');
        console.log(JSON.stringify(event));
        this.currentEnergyPropertyReadingId = event.detail.id;
    }
    


    handleCancel() {
        this.isEditing = false;
        this.currentEPRRecord = { ...this.currentEPRRecords[0].fields };
    }

    handleEdit() {
        this.isEditing = true;
    }

    get isEditing() {
        return this.isEditing;
    }

    get isReadOnly() {
        return !this.isEditing;
    }

    get energyReadingDateTimeFieldValue() {
        console.log('energyReadingDateTimeFieldValue: '+new Date().toISOString());
        return this.currentEPRRecord ? this.currentEPRRecord.fields.FSL_EnergyReadingDateTime__c.value : new Date().toISOString();
    }

    // Retrieving Assets records related to the location related to the related WO
    @wire(getRelatedListRecords, {
        //parentRecordId: '131G50000017HwPIAU',
        parentRecordId: '$currentLocationId',
        relatedListId: 'Assets',
        //fields: EPR_FIELDS,
        fields: ['Asset.Id', 'Asset.LocationId', 'Asset.Location.Name', 'Asset.Name', 'Asset.FSL_P1__c', 'Asset.FSL_EnergyEquipementType__c'],
        sortBy: ['Asset.Name'],
        where: '{FSL_Readable__c: { eq: true }}'
    })
    assetListInfo({ error, data }) {
        //console.log('EPR_FIELDS: '+JSON.stringify(EPR_FIELDS));
        console.log('assetListInfo currentLocationId: '+this.currentLocationId);
        if (data) {
            //console.log('Location Readable Assets getRelatedListRecords data: ' + JSON.stringify(data));
            this.assetRecords = data.records;
            console.log('assetRecords: '+JSON.stringify(this.assetRecords));
            this.assetError = undefined;
            this.hasAssets = true;
        } else if (error) {
            console.log('Location ALL EPR getRelatedListRecords error: ' + JSON.stringify(error));
            this.assetError = error;
            this.assetRecords = undefined;
            this.hasAssets = false;
        }
    }
    
    @wire(getRelatedListRecords, {
        parentRecordId: '$currentEnergyPropertyReadingId',
        relatedListId: 'FSL_EnergyMeterReading__r',
        fields: ['FSL_EnergyMeterReading__c.Id', 'FSL_EnergyMeterReading__c.FSL_Index__c', 
                 'FSL_EnergyMeterReading__c.FSL_Status__c', 'FSL_EnergyMeterReading__c.FSL_Comment__c', 
                 'FSL_EnergyMeterReading__c.FSL_Asset__c'],
        sortBy: ['CreatedDate DESC']
    })
    wiredMeterReadings({ error, data }) {
        if (data) {
            this.assetMeterReadingsMap.clear();  // Reset map before updating
    
            data.records.forEach(reading => {
                const assetId = reading.fields.FSL_Asset__c.value;
    
                if (!this.assetMeterReadingsMap.has(assetId)) {
                    this.assetMeterReadingsMap.set(assetId, []);
                }
                this.assetMeterReadingsMap.get(assetId).push(reading);
            });
    
            console.log("Meter Readings Map: ", this.assetMeterReadingsMap);
        } else if (error) {
            console.error("Error fetching meter readings: ", error);
        }
    }

    // Define fields for record forms
    cptFields = ["Name", "FSL_Index__c", "FSL_Status__c", "FSL_Comment__c"];
    sktFields = ["Name", "FSL_TankValue__c", "FSL_Delivery__c", "FSL_Status__c", "FSL_Comment__c"];

    handleSaisieIndex(event) {
        console.log('handleSaisieIndex');
        console.log('Asset ID - ' + event.target.dataset.id);
        const selectedAssetId = event.target.dataset.id; // Get Asset ID from clicked button
        const selectedAsset = this.assetRecords.find(asset => asset.fields.Id.value === selectedAssetId);
    
        if (!selectedAsset) {
            console.error("No asset found for the selected row.");
            return;
        }
    
        this.selectedAsset = selectedAsset;
    
        // Determine equipment type
        const equipmentType = selectedAsset.fields.FSL_EnergyEquipementType__c?.value;
    
        if (equipmentType === "CPT") {
            this.handleCPTModal(selectedAssetId);
        } else if (equipmentType === "STK") {
            this.handleSTKModal(selectedAssetId);
        } else {
            console.warn("Unknown equipment type:", equipmentType);
        }
    }
    
    // Handle CPT (Meter Reading) Modal
    handleCPTModal(asset) {
        this.showCPTModal = true;
        console.log('handleCPTModal');
        console.log('Asset: ' + asset);
        
        if (this.assetMeterReadingsMap.has(asset) && this.assetMeterReadingsMap.get(asset).length > 0) {
            this.existingMeterReadingId = this.assetMeterReadingsMap.get(asset)[0].Id;
        } else {
            this.existingMeterReadingId = null;
            console.error('No meter readings found for the asset:', asset);
        } 
    
    }
    
    // Handle STK (Stock Reading) Modal
    handleSTKModal(asset) {
        this.showSTKModal = true;
        console.log('handleSTKModal');
        console.log('Asset: ' + asset);
        if (this.assetMeterReadingsMap.has(asset) && this.assetMeterReadingsMap.get(asset).length > 0) {
            this.existingMeterReadingId = this.assetMeterReadingsMap.get(asset)[0].Id;
            console.log('existingMeterReadingId: ' + existingMeterReadingId);
        } else {
            this.existingStockReadingId = null;
            console.error('No meter readings found for the asset:', asset);
        }
    }
    closeCPTModal() {
        this.showCPTModal = false;
        this.selectedEquipmentType = '';
        this.existingMeterReadingId = '';
    }

    closeSTKModal() {
        this.showSTKModal = false;
        this.selectedEquipmentType = '';
        this.existingStockReadingId = '';
    }

    handleSubmitEMR(event) {
        console.log('handleSubmitEMR');
        console.log('event.detail.fields: '+JSON.stringify(event.detail.fields));
        event.preventDefault();       // stop the form from submitting
        this.isEditing = false;
        event.detail.fields.FSL_Asset__c = this.selectedAsset.fields.Id.value; //add all lookup fields
        event.detail.fields.FSL_EnergyPropertyReading__c= this.currentEnergyPropertyReadingId;
        event.detail.fields.FSL_ServiceAppointment__c= this.recordId;
        // event.detail.fields.FSL_InstallationGeographicalZone__c = this.locationId;
        const fields = event.detail.fields;
        console.log('event.detail.fields AFTER: '+JSON.stringify(fields));
        console.log('query: ' + JSON.stringify(this.template.querySelector('.EMR')));
        this.template.querySelector('.EMR').submit(fields);
     }
    

     handleSuccessEMR(event) {
        console.log('handleSuccessEMR');
       //this.assetMeterReadingsMap.get(assetId).push();
        console.log('event success: ' + JSON.stringify(event));
        // this.currentEnergyPropertyReadingId = event.detail.id;
    }

    // Energy Meter Reading
    emrNameField = EMR_NAME_FIELD;
    emrAssetField = EMR_ASSET_FIELD;

    emrFieldsForDataTable = ['FSL_EnergyMeterReading__c.Id', 'FSL_EnergyMeterReading__c.Name', 'FSL_EnergyMeterReading__c.FSL_Asset__c', 'FSL_EnergyMeterReading__c.FSL_Asset__r.Name', 'FSL_EnergyMeterReading__c.FSL_Asset__r.LocationId', 'FSL_EnergyMeterReading__c.FSL_Asset__r.Location.Name', 'FSL_EnergyMeterReading__c.FSL_Asset__r.FSL_P1__c']

    


}