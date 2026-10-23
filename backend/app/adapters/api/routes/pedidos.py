from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Literal

from app.adapters.api.schemas.pedido import PedidoCrear, PedidoRespuesta
from app.infrastructure.database import obtener_sesion
from app.infrastructure.models import PedidoModel

router = APIRouter(tags=["Pedidos"])

class PedidoEstadoActualizar(BaseModel):
    estado: Literal[
        "pendiente",
        "en preparación",
        "en camino",
        "entregado",
        "cancelado",
    ]

@router.post(
    "",
    response_model=PedidoRespuesta,
    status_code=status.HTTP_201_CREATED,
)
def crear_pedido(
    datos: PedidoCrear,
    sesion: Session = Depends(obtener_sesion),
):
    nuevo_pedido = PedidoModel(
        cliente_id=datos.cliente_id,
        direccion_entrega=datos.direccion_entrega,
        total=datos.total,
        estado="pendiente",
    )
    try:
        sesion.add(nuevo_pedido)
        sesion.commit()
        sesion.refresh(nuevo_pedido)
        return nuevo_pedido

    except Exception as error:
        sesion.rollback()
        print(
            f"\nERROR REAL AL CREAR PEDIDO: "
            f"{type(error).__name__}: {error!r}",
            flush=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al guardar pedido: {type(error).__name__}",
        ) from error

@router.get("", response_model=list[PedidoRespuesta])
def listar_pedidos(
    sesion: Session = Depends(obtener_sesion),
):
    try:
        pedidos = (
            sesion.query(PedidoModel)
            .order_by(PedidoModel.id.desc())
            .all()
        )
        return pedidos

    except SQLAlchemyError as error:
        print(f"ERROR AL CONSULTAR PEDIDOS: {error!r}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No fue posible consultar los pedidos.",
        ) from error

@router.patch("/{pedido_id}/estado", response_model=PedidoRespuesta)
def actualizar_estado_pedido(
    pedido_id: int,
    datos: PedidoEstadoActualizar,
    sesion: Session = Depends(obtener_sesion),
):
    try:
        pedido = (
            sesion.query(PedidoModel)
            .filter(PedidoModel.id == pedido_id)
            .first()
        )

        if pedido is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="El pedido no existe.",
            )

        pedido.estado = datos.estado
        sesion.commit()
        sesion.refresh(pedido)

        return pedido

    except HTTPException:
        raise

    except SQLAlchemyError as error:
        sesion.rollback()
        print(f"ERROR AL ACTUALIZAR ESTADO: {error!r}", flush=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No fue posible actualizar el estado del pedido.",
        ) from error
