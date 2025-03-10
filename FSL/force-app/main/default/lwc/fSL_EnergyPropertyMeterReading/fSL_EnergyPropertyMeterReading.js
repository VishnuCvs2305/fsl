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
import TECH_UNIQUE_SA_FIELD from '@salesforce/schema/FSL_EnergyPropertyReading__c.FSL_TECHUniqueServiceAppointment__c';


// Energy Meter Reading fields
import EMR_NAME_FIELD from '@salesforce/schema/FSL_EnergyMeterReading__c.Name';
import EMR_ASSET_FIELD from '@salesforce/schema/FSL_EnergyMeterReading__c.FSL_Asset__c';

// WOLI Object
import WORK_ORDER_LINE_ITEM_OBJECT from '@salesforce/schema/WorkOrderLineItem';

// WOLI fields
import WOLI_ASSET_FIELD from '@salesforce/schema/WorkOrderLineItem.AssetId';
import WOLI_WO_FIELD from '@salesforce/schema/WorkOrderLineItem.WorkOrderId';



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
    previousEPRIdField = PREVIOUSENERYPROPERTYREADINGID_FIELD;
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

    // Define fields for record forms
    cptFields = ["Name", "FSL_Index__c", "FSL_Status__c", "FSL_Comment__c"];
    sktFields = ["Name", "FSL_TankValue__c", "FSL_Delivery__c", "FSL_Status__c", "FSL_Comment__c"];
    
    

    @track eprError;
    @track eprRecords = [];

    @track currentEPRRecords = [];
    @track currentEPRRecord = null;
    @track currentEPRId = null;

    @track previousEPRRecords = [];
    @track previousEPRRecord = null;
    @track previousEPRId = '';

    @track isEditing = false;

    @track assetRecords = [];
    @track assetError;

    @track showCPTModal = false;
    @track showSTKModal = false;
    @track selectedEquipmentType = '';
    @track assetMeterReadingsMap = new Map();
    @track assetWOLIMap = new Map();

    @track existingMeterReadingId = null;
    @track existingEMR = null;
    @track previousEMRRecord = null;
    @track existingStockReadingId = null;

    @track selectedAsset;
    @track selectedAssetId;
    @track equipmentType;



    @wire(getRecord, { recordId: "$recordId", fields: SA_FIELDS })
    serviceAppointment({ error, data }) {
        if (data) {
            console.log('serviceAppointment getRecord data: ' + JSON.stringify(data));
            //this.previousEPRId = data.fields.FSL_PreviousEnergyPropertyReading__c.value;
            //console.log('previousEPRId:' + this.previousEPRId);
            console.log('data.fields.FSL_TECH_ParentWorkOrder__r:' + JSON.stringify(data.fields.FSL_TECH_ParentWorkOrder__r));
            console.log('data.fields.FSL_TECH_ParentWorkOrder__r.value.fields.LocationId:' + JSON.stringify(data.fields.FSL_TECH_ParentWorkOrder__r?.value?.fields?.LocationId));
            this.woId = data.fields.FSL_TECH_ParentWorkOrder__c?.value;
            console.log('woId:' + this.woId);
            this.woRecord = data.fields.FSL_TECH_ParentWorkOrder__r?.value;
            console.log('woRecord:' + JSON.stringify(this.woRecord));
            this.locationId = data.fields.FSL_TECH_ParentWorkOrder__r?.value?.fields?.LocationId?.value;
            this.currentLocationId = this.locationId;
            console.log('locationId:' + this.locationId);
            this.locationRecord = data.fields.FSL_TECH_ParentWorkOrder__r?.value?.fields?.Location?.value;
            console.log('locationRecord:' + JSON.stringify(this.locationRecord));
        }
        else if (error) {
            console.log('serviceAppointment getRecord error: ' + JSON.stringify(error));
        }
    }

    // Retrieving WOLI records related to the current WO
    @wire(getRelatedListRecords, {
        parentRecordId: '$woId',
        relatedListId: 'WorkOrderLineItems',
        //fields: ['WorkOrderLineItem.Id', 'WorkOrderLineItem.AssetId','WorkOrderLineItem.Asset.Id', 'WorkOrderLineItem.Asset.LocationId', 'WorkOrderLineItem.Asset.Location.Name', 'WorkOrderLineItem.Asset.Name', 'WorkOrderLineItem.Asset.FSL_P1__c', 'WorkOrderLineItem.Asset.FSL_EnergyEquipementType__c'],
        fields: ['WorkOrderLineItem.Id', 'WorkOrderLineItem.AssetId'],
        sortBy: ['WorkOrderLineItem.AssetId']
    })
    wiredWOLIList({ error, data }) {
        if (data) {
            console.log("wiredWOLIList data: ", JSON.stringify(data));
            console.log("wiredWOLIList data?.records: ", JSON.stringify(data?.records));

            // Reset map before updating
            this.assetWOLIMap = new Map();

            data.records.forEach(currentWOLI => {
                const assetId = currentWOLI?.fields?.AssetId?.value;
                console.log("WOLI assetId: ", assetId);
                if (!this.assetWOLIMap.has(assetId)) {
                    console.log("wiredWOLIList first time for: ", assetId);
                    this.assetWOLIMap.set(assetId, null);
                }
                this.assetWOLIMap.set(assetId, currentWOLI);
            });

            console.log("assetWOLIMap: ", JSON.stringify([...this.assetWOLIMap]));
        } else if (error) {
            console.error("Error fetching WOLI: ", error);
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
        sortBy: ['-FSL_EnergyPropertyReading__c.FSL_EnergyReadingDateTime__c', '-FSL_EnergyPropertyReading__c.Name'],
        pageSize: 10,
    })
    currentEPRListInfo({ error, data }) {
        console.log('currentLocationId: ' + this.currentLocationId);
        if (data) {
            console.log('data.records.length: ' + data.records.length);
            console.log('Location current EPR getRelatedListRecords data: ' + JSON.stringify(data));
            this.currentEPRRecords = data.records.filter(record => {
                return record.fields.FSL_Intervention__r.value && record.fields.FSL_Intervention__r.value.fields.Id.value === this.woId;
            });
            console.log('currentEPRRecords: ' + JSON.stringify(this.currentEPRRecords));

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
                this.currentEPRId = this.currentEPRRecord.Id;

                // we have an EPR for the current WO, let's see if we have a previous EPR
                this.previousEPRRecords = data.records.filter(record => {
                    return record.fields.FSL_Intervention__r.value && record.fields.FSL_Intervention__r.value.fields.Id.value != this.woId && (record.fields.FSL_EnergyReadingDateTime__c.value < this.currentEPRRecord.FSL_EnergyReadingDateTime__c);
                });
                console.log('previousEPRRecords: ' + JSON.stringify(this.previousEPRRecords));
                if (this.previousEPRRecords.length > 0) { // We see if we have a second record linked to the same Location. This would be the previous EPR for the location.
                    console.log('previousEPRRecords.length > 0');
                    this.previousEPRRecord = this.previousEPRRecords[0];
                    this.previousEPRId = this.previousEPRRecord?.fields?.Id?.value;
                    console.log('previousEPRRecord: ' + JSON.stringify(this.previousEPRRecord));
                } else { // There is no previous EPR linked to the same Location.
                    console.log('There is no previous EPR linked to the same Location');
                    this.previousEPRRecord = null;
                }
            }
            else { // No EPR linked to the same WO
                console.log('this.currentEPRRecords.length = 0');
                if (data.records.length > 0) {
                    this.previousEPRRecord = data.records[0];
                    this.previousEPRId = data.records[0].fields.Id.value;
                }
                this.currentEPRRecord = null;
                this.currentEPRId = null;
            }
            console.log('currentEPRRecord: ' + JSON.stringify(this.currentEPRRecord));
            console.log('currentEPRId: ' + this.currentEPRId);
            console.log('previousEPRRecord: ' + JSON.stringify(this.previousEPRRecord));
            console.log('previousEPRId: ' + this.previousEPRId);
            this.eprError = undefined;
        } else if (error) {
            console.log('Location current EPR getRelatedListRecords error: ' + JSON.stringify(error));
            this.eprError = error;
            this.currentEPRRecords = undefined;
        }
    }

    // Retrieving Assets records related to the location related to the related WO
    @wire(getRelatedListRecords, {
        //parentRecordId: '131G50000017HwPIAU',
        parentRecordId: '$currentLocationId',
        relatedListId: 'Assets',
        //fields: EPR_FIELDS,
        fields: ['Asset.Id', 'Asset.LocationId', 'Asset.Location.Name', 'Asset.Name', 'Asset.FSL_P1__c', 'Asset.FSL_EnergyEquipementType__c', 'Asset.FSL_MeasureUnit__c'],
        sortBy: ['Asset.Name'],
        where: '{FSL_Readable__c: { eq: true }}'
    })
    assetListInfo({ error, data }) {
        //console.log('EPR_FIELDS: '+JSON.stringify(EPR_FIELDS));
        console.log('assetListInfo currentLocationId: ' + this.currentLocationId);
        if (data) {
            //console.log('Location Readable Assets getRelatedListRecords data: ' + JSON.stringify(data));
            this.assetRecords = data.records;
            console.log('assetRecords: ' + JSON.stringify(this.assetRecords));
            this.assetError = undefined;
            this.hasAssets = true;
        } else if (error) {
            console.log('Location ALL EPR getRelatedListRecords error: ' + JSON.stringify(error));
            this.assetError = error;
            this.assetRecords = undefined;
            this.hasAssets = false;
        }
    }

    // Retrieving EMR records related to the current EPR
    @wire(getRelatedListRecords, {
        parentRecordId: '$currentEPRId',
        relatedListId: 'Energy_Meter_Readings__r',
        fields: ['FSL_EnergyMeterReading__c.Id', 'FSL_EnergyMeterReading__c.Name', 'FSL_EnergyMeterReading__c.FSL_Index__c',
            'FSL_EnergyMeterReading__c.FSL_Status__c', 'FSL_EnergyMeterReading__c.FSL_Comment__c',
            'FSL_EnergyMeterReading__c.FSL_Asset__c', 'FSL_EnergyMeterReading__c.FSL_ServiceAppointment__c', 'FSL_EnergyMeterReading__c.FSL_EnergyPropertyReading__c', 'FSL_EnergyMeterReading__c.FSL_WorkOrderLineItem__c', , 'FSL_EnergyMeterReading__c.FSL_Previous_Energy_Meter_Reading__c', 'FSL_EnergyMeterReading__c.CreatedDate'], 
        sortBy: ['-CreatedDate']
    })
    wiredMeterReadings({ error, data }) {
        if (data) {
            console.log("wiredMeterReadings data: ", JSON.stringify(data));
            console.log("wiredMeterReadings data?.records: ", JSON.stringify(data?.records));

            // Reset map before updating
            this.assetMeterReadingsMap = new Map();

            data.records.forEach(reading => {
                const assetId = reading.fields.FSL_Asset__c.value;
                console.log("wiredMeterReadings assetId: ", assetId);
                if (!this.assetMeterReadingsMap.has(assetId)) {
                    console.log("wiredMeterReadings first time for: ", assetId);
                    this.assetMeterReadingsMap.set(assetId, []);
                }
                this.assetMeterReadingsMap.get(assetId).push(reading);
            });

            console.log("Meter Readings Map: ", JSON.stringify([...this.assetMeterReadingsMap]));
        } else if (error) {
            console.error("Error fetching meter readings: ", JSON.stringify(error));
        }
    }

    // Retrieving EMR records related to the currently selected Asset in order to find the previous EMR for this asset, if any
    @wire(getRelatedListRecords, {
        parentRecordId: '$selectedAssetId',
        relatedListId: 'Energy_Meter_Readings__r',
        fields: ['FSL_EnergyMeterReading__c.Id', 'FSL_EnergyMeterReading__c.Name', 'FSL_EnergyMeterReading__c.FSL_Index__c',
            'FSL_EnergyMeterReading__c.FSL_Status__c', 'FSL_EnergyMeterReading__c.FSL_Comment__c',
            'FSL_EnergyMeterReading__c.FSL_Asset__c', 'FSL_EnergyMeterReading__c.FSL_ServiceAppointment__c', 'FSL_EnergyMeterReading__c.FSL_EnergyPropertyReading__c', 'FSL_EnergyMeterReading__c.FSL_WorkOrderLineItem__c', 'FSL_EnergyMeterReading__c.FSL_Previous_Energy_Meter_Reading__c', 'FSL_EnergyMeterReading__c.CreatedDate'], 
        sortBy: ['-CreatedDate'],
        pageSize: 10
    })
    wiredSelectedAssetEMRList({ error, data }) {
        console.log("wiredSelectedAssetEMRList - selectedAssetId: ", this.selectedAssetId);
        if (data) {
            console.log("wiredSelectedAssetEMRList data: ", JSON.stringify(data));
            console.log("wiredSelectedAssetEMRList data?.records: ", JSON.stringify(data?.records));

            const currentEMRRecords = data.records.filter(record => {
                return record.fields?.FSL_ServiceAppointment__c?.value && record.fields?.FSL_ServiceAppointment__c?.value == this.recordId;
            });

            if (currentEMRRecords.length > 0) { // We have found an EMR related to the same Service Appointment. We use it as the current EMR.
                console.log("wiredSelectedAssetEMRList - currentEMRRecords.length > 0");
                const currentEMRRecord = currentEMRRecords[0];
                console.log("currentEMRRecord: ", JSON.stringify(currentEMRRecord));

                // We have found the current EMR, let's find the previous EMR for this Asset
                this.previousEMRRecord = null;
                for (let emrRecord of data.records) {
                    console.log("currentEMRRecord.fields?.FSL_ServiceAppointment__c?.value vs emrRecord.fields?.FSL_ServiceAppointment__c?.value: \n", JSON.stringify(currentEMRRecord.fields?.FSL_ServiceAppointment__c?.value) + '\n' + JSON.stringify(emrRecord.fields?.FSL_ServiceAppointment__c?.value));
                    console.log("currentEMRRecord.fields?.CreatedDate vs emrRecord.fields?.CreatedDate: \n", JSON.stringify(currentEMRRecord.fields?.CreatedDate?.value) + '\n' + JSON.stringify(emrRecord.fields?.CreatedDate?.value));
                    if (emrRecord.fields?.FSL_ServiceAppointment__c?.value != currentEMRRecord.fields?.FSL_ServiceAppointment__c?.value && emrRecord.fields?.CreatedDate?.value < currentEMRRecord.fields?.CreatedDate?.value) {
                        this.previousEMRRecord = emrRecord;
                        console.log('previousEMRRecord found: ' + JSON.stringify(emrRecord));
                        break;
                    }
                }
                console.log("this.previousEMRRecord: ", JSON.stringify(this.previousEMRRecord));
            }
            else { // No currentEMR found, so we will take the latest EMR for his asset as the previous EMR
                this.previousEMRRecord = data?.records[0];
            }
            console.log("this.previousEMRRecord: ", JSON.stringify(this.previousEMRRecord));
        } else if (error) {
            console.error("wiredSelectedAssetEMRList error: ", JSON.stringify(error));
        }
    }


    /*
    handleFieldChange(event) {
        const fieldName = event.target.fieldName;
        const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
        this.currentEPRRecord[fieldName] = value;
    }
    */



    /*
    handleSave() {
        console.log('handleSave');
        console.log('handleSave - this.isEditing BEFORE: '+this.isEditing);
        this.isEditing = false;
        console.log('handleSave - this.isEditing AFTER: '+this.isEditing);
        
    }
    */

    // Existing EPR save
    handleSubmitExistingEPR(event) {
        console.log('handleSubmitExistingEPR');
        console.log('event.detail.fields: ' + JSON.stringify(event.detail.fields));
        event.preventDefault();       // stop the form from submitting
        this.isEditing = false;
        event.detail.fields.FSL_Intervention__c = this.woId;
        event.detail.fields.FSL_InstallationGeographicalZone__c = this.locationId;
        event.detail.fields.FSL_TECHUniqueServiceAppointment__c = this.recordId;
        if (this.previousEPRId) {
            event.detail.fields.FSL_PreviousEnergyPropertyReading__c = this.previousEPRId;
        }
        const fields = event.detail.fields;
        console.log('event.detail.fields AFTER: ' + JSON.stringify(fields));
        console.log(JSON.stringify(fields));
        this.template.querySelector('lightning-record-form').submit(fields);
    }

    // Existing EPR save success
    handleSuccessExistingEPR(event) {
        console.log('handleSuccessExistingEPR');
        console.log(JSON.stringify(event));
        console.log('currentEPRId: ' + this.currentEPRId);
    }




    // New EPR submission
    handleSubmit(event) {
        console.log('handleSubmit');
        console.log('event.detail.fields: ' + JSON.stringify(event.detail.fields));
        event.preventDefault();       // stop the form from submitting
        this.isEditing = false;
        event.detail.fields.FSL_Intervention__c = this.woId;
        event.detail.fields.FSL_InstallationGeographicalZone__c = this.locationId;
        event.detail.fields.FSL_TECHUniqueServiceAppointment__c = this.recordId;
        if (this.previousEPRId) {
            event.detail.fields.FSL_PreviousEnergyPropertyReading__c = this.previousEPRId;
        }
        const fields = event.detail.fields;
        console.log('event.detail.fields AFTER: ' + JSON.stringify(fields));
        console.log(JSON.stringify(fields));
        this.template.querySelector('lightning-record-edit-form').submit(fields);
    }

    // New EPR save success
    handleSuccess(event) {
        console.log('handleSuccess');
        console.log(JSON.stringify(event));
        console.log('currentEPRId: ' + this.currentEPRId);
        this.currentEPRId = event.detail.id;
        console.log('currentEPRId AFTER: ' + this.currentEPRId);
    }



    /*
    handleCancel() {
        this.isEditing = false;
        this.currentEPRRecord = { ...this.currentEPRRecords[0].fields };
    }
    */

    /*
    handleEdit() {
        this.isEditing = true;
    }
    */


    /*
    get isEditing() {
        return this.isEditing;
    }
    */


    /*
    get isReadOnly() {
        return !this.isEditing;
    }
    */


    get energyReadingDateTimeFieldValue() {
        console.log('energyReadingDateTimeFieldValue: ' + new Date().toISOString());
        return this.currentEPRRecord ? this.currentEPRRecord?.FSL_EnergyReadingDateTime__c : new Date().toISOString();
    }

    get previousEMRIndex() {
        console.log('previousEMRIndex');
        console.log('this.previousEMRRecord: '+JSON.stringify(this.previousEMRRecord));
        console.log('this.previousEMRRecord?.fields?.FSL_Index__c?.value: '+JSON.stringify(this.previousEMRRecord?.fields?.FSL_Index__c?.value));

        return this.previousEMRRecord ? this.previousEMRRecord?.fields?.FSL_Index__c?.value : 'No value for previous index';
    }

    get getMeasureUnit() {
        console.log('getMeasureUnit');
        console.log('this.selectedAsset: '+JSON.stringify(this.selectedAsset));
        console.log('this.selectedAsset?.fields?.FSL_MeasureUnit__c?.value: '+JSON.stringify(this.selectedAsset?.fields?.FSL_MeasureUnit__c?.value));

        return this.selectedAsset ? this.selectedAsset?.fields?.FSL_MeasureUnit__c?.value : 'No unit found';
    }

    handleSaisieIndex(event) {
        console.log('handleSaisieIndex');
        console.log('Asset ID - ' + event.target.dataset.id);
        const selectedAssetId = event.target.dataset.id; // Get Asset ID from clicked button
        const selectedAsset = this.assetRecords.find(asset => asset.fields.Id.value === selectedAssetId);

        if (!selectedAsset) {
            console.error("No asset found for the selected row.");
            return;
        }

        this.selectedAssetId = selectedAssetId;
        this.selectedAsset = selectedAsset;

        // Determine equipment type
        this.equipmentType = selectedAsset.fields.FSL_EnergyEquipementType__c?.value;

        if (this.equipmentType === "CPT" || this.equipmentType === "STK") {
            this.handleModal(selectedAssetId, this.equipmentType);
        } else {
            console.warn("Unknown equipment type:", this.equipmentType);
        }
    }

    // Handle CPT (Meter Reading) Modal
    handleModal(asset, equipmentType) {
        console.log('handleModal');
        console.log('Asset: ' + asset);

        console.log('this.assetMeterReadingsMap.has(asset):', this.assetMeterReadingsMap.has(asset));
        // console.log('this.assetMeterReadingsMap.has(asset).length:', this.assetMeterReadingsMap.has(asset).length);
        //console.log('this.existingMeterReadingId = this.assetMeterReadingsMap.get(asset)[0]:', JSON.stringify(this.existingMeterReadingId = this.assetMeterReadingsMap.get(asset)[0]));
        if (this.assetMeterReadingsMap.has(asset)) {
            console.log('Meter readings found for the asset:', asset);
            if (equipmentType === 'CPT') {
                this.showCPTModal = true;
                this.existingMeterReadingId = this.assetMeterReadingsMap.get(asset)[0]?.id;
            }
            else if (equipmentType === 'STK') {
                this.showSTKModal = true;
                this.existingStockReadingId = this.assetMeterReadingsMap.get(asset)[0]?.id;
            }
            this.existingEMR = this.assetMeterReadingsMap.get(asset)[0];
            console.log('existingEMR: ' + JSON.stringify(this.existingEMR));
            console.log('existingMeterReadingId: ' + this.existingMeterReadingId);
            console.log('existingStockReadingId: ' + this.existingStockReadingId);
        } else {
            if (equipmentType === 'CPT') {
                this.showCPTModal = true;
                this.existingMeterReadingId = null;
                console.info('No meter readings found for the CPT asset:', asset);
            }
            else if (equipmentType === 'STK') {
                this.showSTKModal = true;
                this.existingStockReadingId = null;
                console.info('No meter readings found for the STK asset:', asset);
            }
            this.existingEMR = null;
        }

    }

    // Handle STK (Stock Reading) Modal
    // handleSTKModal(asset) {
    //     this.showSTKModal = true;
    //     console.log('handleSTKModal');
    //     console.log('Asset: ' + asset);
    //     if (this.assetMeterReadingsMap.has(asset) && this.assetMeterReadingsMap.get(asset).length > 0) {
    //         this.existingMeterReadingId = this.assetMeterReadingsMap.get(asset)[0].Id;
    //         console.log('existingMeterReadingId: ' + existingMeterReadingId);
    //     } else {
    //         this.existingStockReadingId = null;
    //         console.error('No meter readings found for the asset:', asset);
    //     }
    // }
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


    /*
    handleSubmitEMR(event) {
        console.log('handleSubmitEMR');
        console.log('event.detail.fields: ' + JSON.stringify(event.detail.fields));
        event.preventDefault();       // stop the form from submitting
        this.isEditing = false;
        event.detail.fields.FSL_Asset__c = this.selectedAsset.fields.Id.value; //add all lookup fields
        event.detail.fields.FSL_EnergyPropertyReading__c = this.currentEPRId;
        event.detail.fields.FSL_ServiceAppointment__c = this.recordId;        
        // Handle lookup to WOLI
        // Check if the assetWOLIMap contains the selected asset Id
        console.log('Handling WOLI');
        const assetId = this.selectedAsset.fields.Id.value;
        if (this.assetWOLIMap.has(assetId)) {
            // If it exists, set the FSL_WorkOrderLineItem__c field
            console.log('this.assetWOLIMap.has(' + assetId + '): ' + this.assetWOLIMap.has(assetId));
            console.log('this.assetWOLIMap.get(' + assetId + '): ' + JSON.stringify(this.assetWOLIMap.get(assetId)));
            event.detail.fields.FSL_WorkOrderLineItem__c = this.assetWOLIMap.get(assetId).Id;
        } else {
            // If it doesn't exist, create a new WorkOrderLineItem record
            console.log('this.assetWOLIMap.has(' + assetId + '): ' + this.assetWOLIMap.has(assetId));
            this.createWorkOrderLineItem(assetId, this.woId)
                .then(workOrderLineItemId => {
                    console.log('createWorkOrderLineItem then workOrderLineItemId: ' + workOrderLineItemId);
                    event.detail.fields.FSL_WorkOrderLineItem__c = workOrderLineItemId;
                    //this.submitForm(event.detail.fields);
                })
                .catch(error => {
                    console.log('createWorkOrderLineItem error: ' + JSON.stringify(error));
                    this.showToast('Error', error.body.message, 'error');
                });
            //return;
        }

        const fields = event.detail.fields;
        console.log('event.detail.fields AFTER: ' + JSON.stringify(fields));
        if (this.equipmentType === 'CPT') {
            console.log('query: ' + JSON.stringify(this.template.querySelector('.CPT')));
            this.template.querySelector('.CPT').submit(fields);
        } else if (this.equipmentType === 'STK') {
            console.log('query: ' + JSON.stringify(this.template.querySelector('.STK')));
            this.template.querySelector('.STK').submit(fields);
        }

    }
    */

    async handleSubmitEMR(event) {
        console.log('handleSubmitEMR');
        console.log('event.detail.fields: ' + JSON.stringify(event.detail.fields));
        event.preventDefault();       // stop the form from submitting
        this.isEditing = false;
        if (this.existingEMR?.fields?.FSL_Asset__c?.value) {
            console.log('handleSubmitEMR - FSL_Asset__c is already set to ' + JSON.stringify(this.existingEMR?.fields?.FSL_Asset__c));
        }
        else {
            console.log('handleSubmitEMR - setting FSL_Asset__c to ' + this.selectedAsset.fields.Id.value);
            event.detail.fields.FSL_Asset__c = this.selectedAsset.fields.Id.value;
        }
        if (this.existingEMR?.fields?.FSL_EnergyPropertyReading__c?.value) {
            console.log('handleSubmitEMR - FSL_EnergyPropertyReading__c is already set to ' + JSON.stringify(this.existingEMR?.fields?.FSL_EnergyPropertyReading__c));
        }
        else {
            console.log('handleSubmitEMR - setting FSL_EnergyPropertyReading__c to ' + this.currentEPRId);
            event.detail.fields.FSL_EnergyPropertyReading__c = this.currentEPRId;
        }
        if (this.existingEMR?.fields?.FSL_ServiceAppointment__c?.value) {
            console.log('handleSubmitEMR - FSL_ServiceAppointment__c is already set to ' + JSON.stringify(this.existingEMR?.fields?.FSL_ServiceAppointment__c));
        }
        else {
            console.log('handleSubmitEMR - setting FSL_ServiceAppointment__c to ' + this.recordId);
            event.detail.fields.FSL_ServiceAppointment__c = this.recordId;
        }
        if (this.existingEMR?.fields?.FSL_WorkOrderLineItem__c?.value) {
            console.log('handleSubmitEMR - FSL_WorkOrderLineItem__c is already set to ' + JSON.stringify(this.existingEMR?.fields?.FSL_WorkOrderLineItem__c));
        }
        else {
            console.log('Handling WOLI');
            const assetId = this.selectedAsset.fields.Id.value;
            if (this.assetWOLIMap.has(assetId)) {
                // If it exists, set the FSL_WorkOrderLineItem__c field
                console.log('this.assetWOLIMap.has(' + assetId + '): ' + this.assetWOLIMap.has(assetId));
                console.log('this.assetWOLIMap.get(' + assetId + '): ' + JSON.stringify(this.assetWOLIMap.get(assetId)));
                event.detail.fields.FSL_WorkOrderLineItem__c = this.assetWOLIMap.get(assetId).id;
            } else {
                // If it doesn't exist, create a new WorkOrderLineItem record
                console.log('this.assetWOLIMap.has(' + assetId + '): ' + this.assetWOLIMap.has(assetId));
                const workOrderLineItem = await this.createWorkOrderLineItem(assetId, this.woId);
                console.log('workOrderLineItem: ' + JSON.stringify(workOrderLineItem));
                event.detail.fields.FSL_WorkOrderLineItem__c = workOrderLineItem?.id;
            }
            event.detail.fields.FSL_ServiceAppointment__c = this.recordId;
        }
        //this.previousEMRRecord
        if (this.existingEMR?.fields?.FSL_Previous_Energy_Meter_Reading__c?.value) {
            console.log('handleSubmitEMR - FSL_Previous_Energy_Meter_Reading__c is already set to ' + JSON.stringify(this.existingEMR?.fields?.FSL_Previous_Energy_Meter_Reading__c));
        }
        else if (this.previousEMRRecord?.fields?.Id?.value) {
            console.log('handleSubmitEMR - setting FSL_Asset__c to ' + this.selectedAsset.fields.Id.value);
            event.detail.fields.FSL_Previous_Energy_Meter_Reading__c = this.previousEMRRecord?.fields?.Id?.value;
        }

        //event.detail.fields.FSL_Asset__c = this.selectedAsset.fields.Id.value; //add all lookup fields
        //event.detail.fields.FSL_EnergyPropertyReading__c = this.currentEPRId;
        //event.detail.fields.FSL_ServiceAppointment__c = this.recordId;        
        // Handle lookup to WOLI
        // Check if the assetWOLIMap contains the selected asset Id


        const fields = event.detail.fields;
        console.log('event.detail.fields AFTER: ' + JSON.stringify(fields));
        if (this.equipmentType === 'CPT') {
            console.log('query: ' + JSON.stringify(this.template.querySelector('.CPT')));
            this.template.querySelector('.CPT').submit(fields);
        } else if (this.equipmentType === 'STK') {
            console.log('query: ' + JSON.stringify(this.template.querySelector('.STK')));
            this.template.querySelector('.STK').submit(fields);
        }

    }

    createWorkOrderLineItem(assetId, workOrderId) {
        console.log('createWorkOrderLineItem - AssetId: ' + assetId + ' WorkOrderId: ' + workOrderId);
        const fields = {};
        fields[WOLI_ASSET_FIELD.fieldApiName] = assetId;
        fields[WOLI_WO_FIELD.fieldApiName] = workOrderId;
        console.log('fields: ' + JSON.stringify(fields));
        const recordInput = {
            apiName: WORK_ORDER_LINE_ITEM_OBJECT.objectApiName,
            fields
        };
        console.log('recordInput: ' + JSON.stringify(recordInput));
        return createRecord(recordInput);
    }

    showToast(title, message, variant) {
        const evt = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
        });
        this.dispatchEvent(evt);
    }

    handleSuccessEMR(event) {
        console.log('handleSuccessEMR');
        //this.assetMeterReadingsMap.get(assetId).push();
        console.log('event success: ' + JSON.stringify(event));
        console.log('event event?.detail: ' + JSON.stringify(event?.detail));
        console.log('event event.detail.id: ' + JSON.stringify(event?.detail?.id));
        this.recalculateAssetEMRMap(this.selectedAsset.fields.Id.value, event.detail);
        this.closeCPTModal();
        this.closeSTKModal();
    }

    recalculateAssetEMRMap(anAssetId, anEMR) {
        console.log('recalculateAssetEMRMap - anEMR: ' + JSON.stringify(anEMR) + ', anAssetId: ' + anAssetId);

        if (!this.assetMeterReadingsMap.has(anAssetId)) {
            console.log("First time for: ", anAssetId);
            this.assetMeterReadingsMap.set(anAssetId, []);
        }
        this.assetMeterReadingsMap.get(anAssetId).push(anEMR);
        console.log('assetMeterReadingsMap: ' + JSON.stringify(...this.assetMeterReadingsMap));
    }


    handleRemplacement(event) {
        console.log('handleRemplacement');
        console.log('Asset ID - ' + event.target.dataset.id);
        this.showRemplacementModal = true;
        const selectedAssetId = event.target.dataset.id; // Get Asset ID from clicked button
        const selectedAsset = this.assetRecords.find(asset => asset.fields.Id.value === selectedAssetId);
    
        if (!selectedAsset) {
            console.error("No asset found for the selected row.");
            return;
        }
        
        this.selectedAssetId = selectedAssetId;
        this.selectedAsset = selectedAsset;
        if (this.assetMeterReadingsMap.has(selectedAssetId)) {
            console.log('Meter readings found for the asset:', selectedAssetId);
                this.existingRemplacementId = this.assetMeterReadingsMap.get(selectedAssetId)[0]?.id;
        } else {
            this.existingRemplacementId = null;
            // this.showRemplacementModal = false;
            // this.handleSaisieIndex(event);
            console.error('No meter readings found for the asset:', selectedAssetId);
        }
    }

    handleRemplacementRedirect(event) {
        console.log('handleRemplacementRedirect');
        this.showRemplacementModal = false;
        const selectedAsset = this.selectedAsset;

        // Determine equipment type
        this.equipmentType = selectedAsset.fields.FSL_EnergyEquipementType__c?.value;
    
        if (this.equipmentType === "CPT" || this.equipmentType === "STK") {
            this.handleModal(selectedAsset.fields.Id.value,  this.equipmentType);
        } else {
            console.warn("Unknown equipment type:", this.equipmentType);
        }

    }

    closeRemplacementModal() {
        this.showRemplacementModal = false;
        this.existingRemplacementId = '';
    }

    // Energy Meter Reading
    emrNameField = EMR_NAME_FIELD;
    emrAssetField = EMR_ASSET_FIELD;

    emrFieldsForDataTable = ['FSL_EnergyMeterReading__c.Id', 'FSL_EnergyMeterReading__c.Name', 'FSL_EnergyMeterReading__c.FSL_Asset__c', 'FSL_EnergyMeterReading__c.FSL_Asset__r.Name', 'FSL_EnergyMeterReading__c.FSL_Asset__r.LocationId', 'FSL_EnergyMeterReading__c.FSL_Asset__r.Location.Name', 'FSL_EnergyMeterReading__c.FSL_Asset__r.FSL_P1__c']




}