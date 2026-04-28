// @ts-nocheck
/**
 * Periodic Service - Handles all CRUD operations for periodic data
 * Aligned with Joi validation schema
 */

class PeriodicService {
  /**
   * GET - Fetch all periodics with pagination and filtering
   * @param {Object} params - Query parameters
   * @param {string} params.sortBy - Sort field
   * @param {number} params.limit - Items per page
   * @param {number} params.page - Page number
   * @param {boolean} params.noPagination - Get all items without pagination
   * @param {Function} executeApiCall - API call function
   */
  static async getAllPeriodics(params = {}, executeApiCall) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.page) queryParams.append('page', params.page);
      if (params.noPagination !== undefined) queryParams.append('noPagination', params.noPagination);

      const url = `/client/periodic?${queryParams.toString()}`;
      
      const response = await executeApiCall({
        method: 'get',
        url,
      });

      return response;
    } catch (error) {
      console.error('Error fetching periodics:', error);
      throw error;
    }
  }

  /**
   * GET - Fetch a specific periodic by ID
   * @param {string} id - Periodic ID (objectId)
   * @param {Function} executeApiCall - API call function
   */
  static async getPeriodicById(id, executeApiCall) {
    try {
      if (!id || id === '[object Object]') {
        throw new Error('Invalid periodic ID');
      }

      const response = await executeApiCall({
        method: 'get',
        url: `/client/periodic/${id}`,
      });

      return response;
    } catch (error) {
      console.error('Error fetching periodic:', error);
      throw error;
    }
  }

  /**
   * POST - Create a new periodic
   * @param {Object} data - Periodic data (validated with Joi)
   * @param {Function} executeApiCall - API call function
   */
  static async createPeriodic(data, executeApiCall) {
    try {
      // Validate required fields
      if (!data.client) {
        throw new Error('Client is required');
      }
      if (!data.periodic_type) {
        throw new Error('Periodic type is required');
      }

      // Construct payload aligned with Joi schema
      const payload = PeriodicService.constructPayload(data);

      const response = await executeApiCall({
        method: 'post',
        url: '/client/periodic',
        data: payload,
      });

      return response;
    } catch (error) {
      console.error('Error creating periodic:', error);
      throw error;
    }
  }

  /**
   * PATCH - Update an existing periodic
   * @param {string} id - Periodic ID (objectId)
   * @param {Object} data - Updated periodic data
   * @param {Function} executeApiCall - API call function
   */
  static async updatePeriodic(id, data, executeApiCall) {
    try {
      if (!id || id === '[object Object]') {
        throw new Error('Invalid periodic ID');
      }

      // Only include fields that are provided (for partial updates)
      const payload = PeriodicService.constructPayload(data, true);

      const response = await executeApiCall({
        method: 'patch',
        url: `/client/periodic/${id}`,
        data: payload,
      });

      return response;
    } catch (error) {
      console.error('Error updating periodic:', error);
      throw error;
    }
  }

  /**
   * DELETE - Delete a periodic
   * @param {string} id - Periodic ID (objectId)
   * @param {Function} executeApiCall - API call function
   */
  static async deletePeriodic(id, executeApiCall) {
    try {
      if (!id || id === '[object Object]') {
        throw new Error('Invalid periodic ID');
      }

      const response = await executeApiCall({
        method: 'delete',
        url: `/client/periodic/${id}`,
      });

      return response;
    } catch (error) {
      console.error('Error deleting periodic:', error);
      throw error;
    }
  }

  /**
   * PATCH - Approve or reject a periodic
   * @param {string} id - Periodic ID (objectId)
   * @param {string} status - 'approved' or 'rejected'
   * @param {string} remarks - Optional remarks
   * @param {Function} executeApiCall - API call function
   */
  static async approvePeriodic(id, status, remarks = '', executeApiCall) {
    try {
      if (!id || id === '[object Object]') {
        throw new Error('Invalid periodic ID');
      }

      if (!['approved', 'rejected'].includes(status)) {
        throw new Error('Status must be "approved" or "rejected"');
      }

      const payload = {
        status,
        remarks,
      };

      const response = await executeApiCall({
        method: 'patch',
        url: `/client/periodic/${id}/approve`,
        data: payload,
      });

      return response;
    } catch (error) {
      console.error('Error approving periodic:', error);
      throw error;
    }
  }

  /**
   * POST - Create or update worksheet for a periodic
   * @param {string} id - Periodic ID (objectId)
   * @param {Object} worksheetData - Worksheet data
   * @param {Function} executeApiCall - API call function
   */
  static async createWorksheet(id, worksheetData, executeApiCall) {
    try {
      if (!id || id === '[object Object]') {
        throw new Error('Invalid periodic ID');
      }

      // Validate required worksheet fields
      if (!worksheetData.comment) {
        throw new Error('Comment is required');
      }
      if (!worksheetData.signature) {
        throw new Error('Signature is required');
      }
      if (!worksheetData.date) {
        throw new Error('Date is required');
      }
      if (!worksheetData.name) {
        throw new Error('Name is required');
      }

      const payload = {
        comment: worksheetData.comment,
        signature: worksheetData.signature,
        date: worksheetData.date, // Should be in YYYY-MM-DD format
        workCompletionDate: worksheetData.workCompletionDate || '',
        name: worksheetData.name,
      };

      const response = await executeApiCall({
        method: 'post',
        url: `/client/periodic/${id}/worksheet`,
        data: payload,
      });

      return response;
    } catch (error) {
      console.error('Error creating worksheet:', error);
      throw error;
    }
  }

  /**
   * POST - Add staff/employee details to periodic
   * @param {string} id - Periodic ID (objectId)
   * @param {Array} staffData - Array of staff entries
   * @param {Function} executeApiCall - API call function
   */
  static async addStaffList(id, staffData, executeApiCall) {
    try {
      if (!id || id === '[object Object]') {
        throw new Error('Invalid periodic ID');
      }

      if (!Array.isArray(staffData) || staffData.length === 0) {
        throw new Error('Staff data must be a non-empty array');
      }

      // Validate each staff entry
      const validatedStaffData = staffData.map((item) => {
        if (!item.client) throw new Error('Client is required for each staff entry');
        if (!item.date) throw new Error('Date is required for each staff entry');
        if (!item.hours || !Array.isArray(item.hours)) throw new Error('Hours array is required');
        if (!item.periodic) throw new Error('Periodic ID is required for each staff entry');
        if (!item.periodicSubId) throw new Error('Periodic sub ID is required for each staff entry');

        return {
          client: item.client,
          date: item.date, // Should be in YYYY-MM-DD format
          hours: item.hours.map((h) => ({ hour: Number(h.hour) })),
          position: item.position || 'operative', // operative, supervisor, manager, other
          periodic: item.periodic,
          periodicSubId: item.periodicSubId,
        };
      });

      const response = await executeApiCall({
        method: 'post',
        url: `/client/periodic/${id}/staff`,
        data: validatedStaffData,
      });

      return response;
    } catch (error) {
      console.error('Error adding staff list:', error);
      throw error;
    }
  }

  /**
   * Construct payload aligned with Joi schema
   * @private
   * @param {Object} data - Raw data
   * @param {boolean} isPartialUpdate - Is this a partial update
   */
  static constructPayload(data, isPartialUpdate = false) {
    const payload = {};

    // String fields with custom validation
    if (data.client !== undefined) {
      payload.client = String(data.client);
    }

    if (data.periodic_type !== undefined) {
      const validTypes = ['accommodation', 'window', 'regular', 'other'];
      if (!validTypes.includes(data.periodic_type)) {
        throw new Error('Invalid periodic_type. Must be one of: accommodation, window, regular, other');
      }
      payload.periodic_type = data.periodic_type;
    }

    // Numeric fields
    if (data.frequency !== undefined) {
      payload.frequency = data.frequency ? Number(data.frequency) : null;
    }

    if (data.yearlyBudget !== undefined) {
      payload.yearlyBudget = Number(data.yearlyBudget) || 0;
    }

    if (data.yearlyHour !== undefined) {
      payload.yearlyHour = Number(data.yearlyHour) || 0;
    }

    if (data.monthlyValue !== undefined) {
      payload.monthlyValue = Number(data.monthlyValue) || 0;
    }

    if (data.monthlyHours !== undefined) {
      payload.monthlyHours = Number(data.monthlyHours) || 0;
    }

    if (data.remainingBudget !== undefined) {
      payload.remainingBudget = Number(data.remainingBudget) || 0;
    }

    if (data.remainingHour !== undefined) {
      payload.remainingHour = Number(data.remainingHour) || 0;
    }

    // Array fields
    if (data.months !== undefined) {
      payload.months = Array.isArray(data.months) ? data.months : [];
    }

    if (data.dates !== undefined) {
      payload.dates = Array.isArray(data.dates) ? data.dates : [];
    }

    if (data.assigned_employees !== undefined) {
      payload.assigned_employees = Array.isArray(data.assigned_employees) ? data.assigned_employees : [];
    }

    // Periodic details array
    if (data.periodic !== undefined) {
      payload.periodic = Array.isArray(data.periodic)
        ? data.periodic.map((item) => ({
            date: item.date || '',
            hours: item.hours ? Number(item.hours) : null,
            chargeRate: item.chargeRate ? Number(item.chargeRate) : null,
            supervisorRate: item.supervisorRate ? Number(item.supervisorRate) : null,
            rate: item.rate ? Number(item.rate) : null,
            comment: item.comment || '',
          }))
        : [];
    }

    // Periodic accommodations
    if (data.periodic_accommodations !== undefined) {
      payload.periodic_accommodations = Array.isArray(data.periodic_accommodations) ? data.periodic_accommodations : [];
    }

    // Worksheet object
    if (data.worksheet !== undefined && data.worksheet) {
      payload.worksheet = {
        comment: data.worksheet.comment || '',
        signature: data.worksheet.signature || '',
        date: data.worksheet.date || '',
        workCompletionDate: data.worksheet.workCompletionDate || '',
        name: data.worksheet.name || '',
      };
    }

    // Boolean fields
    if (data.isWorksheetUploaded !== undefined) {
      payload.isWorksheetUploaded = Boolean(data.isWorksheetUploaded);
    }

    // String fields
    if (data.description !== undefined) {
      payload.description = String(data.description) || '';
    }

    if (data.approved_by_signature !== undefined) {
      payload.approved_by_signature = String(data.approved_by_signature) || '';
    }

    if (data.approved_by_name !== undefined) {
      payload.approved_by_name = String(data.approved_by_name) || '';
    }

    if (data.status !== undefined) {
      const validStatuses = ['pending', 'approved', 'completed', 'cancelled'];
      if (!validStatuses.includes(data.status)) {
        throw new Error('Invalid status. Must be one of: pending, approved, completed, cancelled');
      }
      payload.status = data.status;
    }

    // Audit fields
    if (data.createdBy !== undefined) {
      payload.createdBy = String(data.createdBy);
    }

    if (data.updatedBy !== undefined) {
      payload.updatedBy = String(data.updatedBy);
    }

    return payload;
  }
}

export default PeriodicService;
