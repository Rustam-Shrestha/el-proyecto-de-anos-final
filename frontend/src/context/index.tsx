// @ts-nocheck
/**
 * @deprecated This ModalContext is superseded by Redux Toolkit.
 *
 * For new code, prefer:
 *   - useAuth()  from 'hooks/useAuth'   → userData, setUserData, clientDetails
 *   - useUI()    from 'hooks/useUI'     → openModal, closeModal, triggerRefetch, triggerMenuAction
 *
 * Kept temporarily for backward compatibility with features not yet migrated.
 *
 * BRIDGE: openModal / closeModal / triggerRefetch / triggerMenuAction now
 * dispatch to the Redux store so that page.js (which reads modalContent from
 * Redux) stays in sync with legacy consumers that still call useModal().
 */
// context/ModalContext.jsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  openModal as reduxOpenModal,
  closeModal as reduxCloseModal,
  triggerRefetch as reduxTriggerRefetch,
  triggerMenuAction as reduxTriggerMenuAction,
  selectRefetch as selectReduxRefetch,
  selectModalContent as selectReduxModalContent,
} from "../store/slices/uiSlice";
import { selectUserData as selectReduxUserData } from "../store/slices/authSlice";

const ModalContext = createContext();

export const ModalProvider = ({ children }) => {
  const dispatch = useDispatch();

  const [modalContent, setModalContent] = useState(null);
  const [modalProps, setModalProps] = useState({});
  const [refetch, setRefetch] = useState(false);
  const [menuAction, setMenuAction] = useState(null);
  const [userData, setUserData] = useState(() => {
    try {
      const stored = localStorage.getItem("userData");
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      console.error("Failed to parse userData from localStorage", e);
      return {};
    }
  });

  const [clientDetails, setClientDetails] = useState({
    name: "",
    id: "",
  });

  // -----------------------------------------------------------
  // Redux → Context sync: When migrated components change Redux
  // state (e.g. DeleteAction calling useUI().triggerRefetch()),
  // we mirror the change into Context so non-migrated consumers
  // that read useModal().refetch still react.
  // -----------------------------------------------------------
  const reduxRefetch = useSelector(selectReduxRefetch);
  const reduxModalContent = useSelector(selectReduxModalContent);
  const reduxUserData = useSelector(selectReduxUserData);

  // Track whether the Context itself caused the Redux change to avoid loops
  const selfTriggeredRefetch = useRef(false);
  const selfTriggeredModal = useRef(false);

  // Sync Redux userData → Context userData (login sets Redux; legacy components read Context)
  useEffect(() => {
    if (reduxUserData && reduxUserData.id) {
      setUserData(reduxUserData);
    }
  }, [reduxUserData]);

  // Sync Redux refetch → Context refetch
  useEffect(() => {
    if (selfTriggeredRefetch.current) {
      selfTriggeredRefetch.current = false;
      return;
    }
    // Redux changed externally (migrated component) — sync to Context
    setRefetch(reduxRefetch);
  }, [reduxRefetch]);

  // Sync Redux modalContent → Context modalContent
  useEffect(() => {
    if (selfTriggeredModal.current) {
      selfTriggeredModal.current = false;
      return;
    }
    // Redux changed externally (migrated component) — sync to Context
    if (reduxModalContent) {
      setModalContent(() => reduxModalContent);
    } else {
      setModalContent(null);
      setModalProps({});
    }
  }, [reduxModalContent]);

  /**
   * Open a modal — writes to BOTH Context state (legacy) AND Redux (for page.js).
   */
  const openModal = useCallback((component, props = {}) => {
    selfTriggeredModal.current = true;
    if (component === null || component === undefined) {
      setModalContent(null);
      setModalProps({});
      dispatch(reduxCloseModal());
      return;
    }
    setModalContent(() => component);
    setModalProps(props);
    // Bridge: keep Redux in sync so page.js renders the modal
    dispatch(reduxOpenModal({ component, props }));
  }, [dispatch]);

  /**
   * Close the modal — clears BOTH Context state AND Redux.
   */
  const closeModal = useCallback(() => {
    selfTriggeredModal.current = true;
    setModalContent(null);
    setModalProps({});
    // Bridge: clear Redux so page.js stops rendering the modal
    dispatch(reduxCloseModal());
  }, [dispatch]);

  /**
   * Toggle refetch flag — notifies BOTH Context consumers AND Redux consumers.
   */
  const triggerRefetch = useCallback(() => {
    selfTriggeredRefetch.current = true;
    setRefetch((prev) => !prev);
    dispatch(reduxTriggerRefetch());
  }, [dispatch]);

  /**
   * Set menu action — writes to BOTH Context AND Redux.
   */
  const triggerMenuAction = useCallback((menu) => {
    setMenuAction(menu);
    dispatch(reduxTriggerMenuAction(menu));
  }, [dispatch]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("userData");
      if (stored) {
        setUserData(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to parse userData in sync effect", e);
    }
  }, []);

  return (
    <ModalContext.Provider
      value={{
        userData,
        setUserData,
        modalContent,
        modalProps,
        openModal,
        closeModal,
        refetch,
        triggerRefetch,
        menuAction,
        triggerMenuAction,
        clientDetails,
        setClientDetails,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
};
