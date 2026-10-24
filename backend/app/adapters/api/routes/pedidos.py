from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Literal

from app.adapters.api.schemas.pedido import PedidoCrear, PedidoRespuesta
from app.infrastructure.database import obtener_sesion
from decimal import Decimal 
from app.infrastructure.models import (
    PedidoModel,
    ProductoModel,
    DetallePedidoModel,
)

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
    # Evitar productos repetidos en la misma solicitud.
    ids_productos = [item.producto_id for item in datos.productos]

    if len(ids_productos) != len(set(ids_productos)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No repitas productos en el pedido.",
        )

    productos_db = (
        sesion.query(ProductoModel)
        .filter(ProductoModel.id.in_(ids_productos))
        .all()
    )

    productos_por_id = {
        producto.id: producto for producto in productos_db
    }

    if len(productos_por_id) != len(ids_productos):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uno o más productos no existen.",
        )

    for item in datos.productos:
        producto = productos_por_id[item.producto_id]

        if not producto.disponible:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"El producto '{producto.nombre}' no está disponible.",
            )

    total_calculado = sum(
        (
            Decimal(str(productos_por_id[item.producto_id].precio))
            * item.cantidad
            for item in datos.productos
        ),
        Decimal("0.00"),
    )

    nuevo_pedido = PedidoModel(
        cliente_id=datos.cliente_id,
        direccion_entrega=datos.direccion_entrega,
        total=total_calculado,
        estado="pendiente",
    )

    try:
        sesion.add(nuevo_pedido)
        sesion.flush()

        for item in datos.productos:
            producto = productos_por_id[item.producto_id]

            detalle = DetallePedidoModel(
                pedido_id=nuevo_pedido.id,
                producto_id=producto.id,
                cantidad=item.cantidad,
                precio_unitario=producto.precio,
            )
            sesion.add(detalle)

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
            detail="No fue posible guardar el pedido.",
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
