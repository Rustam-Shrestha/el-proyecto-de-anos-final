// @ts-nocheck
import { useCallback, useEffect, useState } from "react";
import { apiService } from "./apiService";

const withApiCall = (
  WrappedComponent,
  { method = "get", url, payload = {}, headers = {}, fetchOnMount = false } = {}
) => {
  return (props) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);
    const [response, setResponse] = useState(null);

    const executeApiCall = useCallback(async (overrideConfig = {}) => {
      setLoading(true);
      setError(null);
      try {
        // Choose the correct API method based on the configuration
        const response = await apiService[overrideConfig.method || method](
          overrideConfig.url || url,
          overrideConfig.payload || payload,
          overrideConfig.headers || headers
        );

        // Store and return the response data
        const responseData = response?.data;
        setResponse(response);
        setData(responseData);
        return responseData;
      } catch (err) {
        setError(err.response?.data || { message: "An error occurred" });
        throw err.response?.data || err;
      } finally {
        setLoading(false);
      }
    }, []);

    // Fetch data on mount if fetchOnMount is true
    useEffect(() => {
      if (fetchOnMount) {
        executeApiCall();
      }
    }, [executeApiCall]); // Empty dependency array ensures this only runs once on mount

    return (
      <WrappedComponent
        {...props}
        executeApiCall={executeApiCall}
        loading={loading}
        error={error}
        data={data}
        response={response}
      />
    );
  };
};

export default withApiCall;
