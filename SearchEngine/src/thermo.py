import math
from config import P_IN_NOM, T_IN_NOM, GAMMA

def model_isentropique(ratio):
    """
    Retourne (P_out [Pa],T_out[K] selon loi isentropique :
    P_out=P_in*ratio
    T_out=T_in*ratio**((GAMMA-1)/GAMMA)
    """

    P_out = P_IN_NOM * ratio
    exp=(GAMMA - 1) / GAMMA
    T_out = T_IN_NOM *(ratio ** exp) 
    return P_out,T_out

