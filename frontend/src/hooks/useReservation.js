// useReservation.js — raccourci pour lire le contexte du séjour en cours.
import { useContext } from "react";
import { ReservationContext } from "../context/ReservationContext";

export function useReservation() {
  return useContext(ReservationContext);
}
