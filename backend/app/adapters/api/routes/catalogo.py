from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.adapters.api.schemas.catalogo import (
    CategoriaCrear,
    CategoriaRespuesta,
    ProductoCrear,
    ProductoRespuesta,
)
from app.infrastructure.database import obtener_sesion
from app.infrastructure.models import CategoriaModel, ProductoModel

router = APIRouter(tags=["Catálogo"])

# CATEGORÍAS 

@router.get("/categorias", response_model=list[CategoriaRespuesta])
def listar_categorias(
    sesion: Session = Depends(obtener_sesion),
):
    try:
        return (
            sesion.query(CategoriaModel)
            .filter(CategoriaModel.activa.is_(True))
            .order_by(CategoriaModel.nombre.asc())
            .all()
        )
    except SQLAlchemyError as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No fue posible consultar las categorías.",
        ) from error

@router.post(
    "/categorias",
    response_model=CategoriaRespuesta,
    status_code=status.HTTP_201_CREATED,
)
def crear_categoria(
    datos: CategoriaCrear,
    sesion: Session = Depends(obtener_sesion),
):
    nueva_categoria = CategoriaModel(
        nombre=datos.nombre.strip(),
        descripcion=datos.descripcion,
    )

    if not nueva_categoria.nombre:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="El nombre de la categoría es obligatorio.",
        )

    try:
        sesion.add(nueva_categoria)
        sesion.commit()
        sesion.refresh(nueva_categoria)
        return nueva_categoria
    except IntegrityError as error:
        sesion.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe una categoría con ese nombre.",
        ) from error
    except SQLAlchemyError as error:
        sesion.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No fue posible guardar la categoría.",
        ) from error

# PRODUCTOS 

@router.get("/productos", response_model=list[ProductoRespuesta])
def listar_productos(
    categoria_id: int | None = None,
    sesion: Session = Depends(obtener_sesion),
):
    try:
        consulta = (
            sesion.query(ProductoModel)
            .join(CategoriaModel)
            .filter(
                ProductoModel.disponible.is_(True),
                CategoriaModel.activa.is_(True),
            )
        )

        if categoria_id is not None:
            consulta = consulta.filter(
                ProductoModel.categoria_id == categoria_id
            )

        return consulta.order_by(ProductoModel.nombre.asc()).all()

    except SQLAlchemyError as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No fue posible consultar los productos.",
        ) from error


@router.post(
    "/productos",
    response_model=ProductoRespuesta,
    status_code=status.HTTP_201_CREATED,
)
def crear_producto(
    datos: ProductoCrear,
    sesion: Session = Depends(obtener_sesion),
):
    categoria = (
        sesion.query(CategoriaModel)
        .filter(
            CategoriaModel.id == datos.categoria_id,
            CategoriaModel.activa.is_(True),
        )
        .first()
    )

    if categoria is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="La categoría no existe o está inactiva.",
        )

    nuevo_producto = ProductoModel(
        categoria_id=datos.categoria_id,
        nombre=datos.nombre.strip(),
        descripcion=datos.descripcion,
        precio=datos.precio,
        imagen_url=datos.imagen_url,
        disponible=datos.disponible,
    )

    if not nuevo_producto.nombre:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="El nombre del producto es obligatorio.",
        )

    try:
        sesion.add(nuevo_producto)
        sesion.commit()
        sesion.refresh(nuevo_producto)
        return nuevo_producto
    except SQLAlchemyError as error:
        sesion.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No fue posible guardar el producto.",
        ) from error
