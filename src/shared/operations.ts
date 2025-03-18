import { dynamicsWebApi } from "./client";
interface RecordDetail {
    guid: string;
    name: string;
}

interface ExpandedRecordDetail extends RecordDetail {
    expanded?: any;
}

export class DynamicsOperations {
    // Keep original for backward compatibility
    async getGuidByField(collection: string, field: string, value: string, guidField: string = ''): Promise<string> {
        const result = await this.getRecordByField({
            collection,
            field,
            value,
            guidField
        });
        return result.guid;
    }

    // New method with extended functionality
    async getRecordByField({
        collection,
        field,
        value,
        guidField,
        nameField = 'cven_name'
    }: {
        collection: string;
        field: string;
        value: string | number;
        guidField?: string;
        nameField?: string;
    }): Promise<RecordDetail> {
        try {
            const response = await dynamicsWebApi.retrieveMultiple({
                collection: collection.endsWith('s') ? collection + 'es' : collection + 's',
                filter: typeof value === 'string' ? `${field} eq '${value}'` : `${field} eq ${value}`,
                select: [guidField || collection + 'id', nameField],
            });

            if (response.value.length === 0) {
                throw new Error(`No record found in ${collection} where ${field} = ${value}`);
            }

            if (response.value.length > 1) {
                throw new Error(`Multiple records found in ${collection} where ${field} = ${value}`);
            }

            const record = response.value[0];
            const guid = guidField ? record[guidField] : record[collection + 'id'];
            const name = record[nameField];

            if (!guid) {
                throw new Error('GUID field not found in record');
            }

            return {
                guid,
                name: name || ''
            };
        } catch (error) {
            console.error('Error retrieving record details:', error);
            throw new Error(`Failed to retrieve record details: ${error.message}`);
        }
    }

    async getRecordWithExpand(
        collection: string,
        expandRelation: string,
        filterField: string,
        filterValue: string
    ): Promise<ExpandedRecordDetail> {
        try {
            const response = await dynamicsWebApi.retrieveMultiple({
                collection: collection.endsWith('s') ? collection + 'es' : collection + 's',
                expand: [{ 
                    property: expandRelation,
                    filter: `${filterField} eq '${filterValue}'`
                }],
                apply: `filter(${expandRelation}/${filterField} eq '${filterValue}')`,
                select: ['cven_name', collection + 'id'],
            });
    
            if (response.value.length === 0) {
                throw new Error(`No record found in ${collection} with ${filterField} = ${filterValue}`);
            }
    
            const record = response.value[0];
            
            return {
                guid: record[collection + 'id'],
                name: record.cven_name || '',
                expanded: record[expandRelation]
            };
        } catch (error) {
            console.error('Error retrieving expanded record:', error);
            throw new Error(`Failed to retrieve expanded record: ${error.message}`);
        }
    }

    async updateRecord(req: { collection: string; recordId: string; data: object; }) {
        try {
            await dynamicsWebApi.update({
                data: req.data,
                key: req.recordId,
                collection: req.collection
            });
            return { success: true };
        } catch (error) {
            console.error('Error updating record:', error);
            throw new Error('Failed to update record');
        }
    }

    async createRecord(req: { collection: string, data: any }) {
        try {
            await dynamicsWebApi.create({
                data: req.data,
                collection: req.collection
            });
            return { success: true };
        } catch (error) {
            console.error('Error updating record:', error);
            throw new Error(error.message);
        }
    }
    async upsertRecord(req: { collection: string, data: any, alternate_key?: string[], key?: string }) {
        
        try {
            await dynamicsWebApi.upsert({
                data: req.data,
                collection: req.collection,
                returnRepresentation: true,
                key: req.key,
            });
            return { success: true };
        } catch (error) {
            if(error.status === 412) {
                return { success: true };
            }
            throw new Error(error.message);
        }
    }

    async associateRecord(req: { collection: string, primaryKey: string, relatedCollection: string, relatedKey: string, relationshipName: string }) {
        try {
            await dynamicsWebApi.associate({
                collection: req.collection,
                primaryKey: req.primaryKey,
                relationshipName: req.relationshipName,
                relatedCollection: req.relatedCollection,
                relatedKey: req.relatedKey
            });
            return { success: true };
        } catch (error) {
            throw new Error(error.message);
        }
    }
}