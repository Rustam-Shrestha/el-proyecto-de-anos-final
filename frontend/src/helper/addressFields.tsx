// @ts-nocheck
/**
 * AddressBlock Component
 *
 * Renders a form section for entering an address (address line, town, city,
 * county, post code, date range). Used in employee and client forms.
 *
 * @param {number} index - Zero-based address index
 * @param {object} address - Address data object
 * @param {Function} handleChange - Form change handler
 */
import { memo } from "react";
import { CustomDatePicker } from "../components/common";
import InputField from "../components/common/InputField";

const AddressBlock = memo(({ index, address, handleChange }) => {
  const prefix = `addresses[${index}]`;

  return (
    <div className="rounded-lg border p-4 mt-4">
      <h4 className="font-semibold mb-2">Address {index + 1}</h4>

      <div className="grid grid-cols-2 gap-4">
        <InputField
          name={`${prefix}.address1`}
          value={address.address1}
          onChange={handleChange}
          label="Address"
          placeholder="Enter address"
        />

        <InputField
          name={`${prefix}.town`}
          value={address.town}
          onChange={handleChange}
          label="Town"
        />

        <InputField
          name={`${prefix}.city`}
          value={address.city}
          onChange={handleChange}
          label="City"
        />

        <InputField
          name={`${prefix}.county`}
          value={address.county}
          onChange={handleChange}
          label="County"
        />

        <InputField
          name={`${prefix}.postCode`}
          value={address.postCode}
          onChange={handleChange}
          label="Post Code"
        />

        {/* From Date */}
        <CustomDatePicker
          label="From Date"
          name={`${prefix}.fromDate`}
          value={address.fromDate}
          onChange={handleChange}
          isForm
        />

        {/* To Date */}
        <CustomDatePicker
          label="To Date"
          name={`${prefix}.toDate`}
          value={address.toDate}
          onChange={handleChange}
          isForm
        />
      </div>
    </div>
  );
});

AddressBlock.displayName = "AddressBlock";

export default AddressBlock;
