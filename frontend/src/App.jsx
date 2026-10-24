import { useCallback, useEffect, useState } from 'react'
import {
  Bike,
  ClipboardList,
  PlusCircle,
  RefreshCw,
  ShoppingBag,
  UtensilsCrossed,
  ListFilter,
} from 'lucide-react'
import './styles.css'

const API_URL = (
  import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'
).replace(/\/$/, '')

const roles = [
  {
    title: 'Portal del cliente',
    description:
      'Explorar productos, administrar el carrito y realizar pedidos.',
    icon: ShoppingBag,
    tag: 'RF-01 a RF-07',
  },
  {
    title: 'Administración',
    description:
      'Gestionar el catálogo, las órdenes, los repartidores y las estadísticas.',
    icon: ClipboardList,
    tag: 'RF-08 a RF-13',
  },
  {
    title: 'Portal del repartidor',
    description:
      'Consultar entregas asignadas y actualizar su estado.',
    icon: Bike,
    tag: 'RF-14 a RF-16',
  },
]

const estadosPedido = [
  'pendiente',
  'en preparación',
  'en camino',
  'entregado',
  'cancelado',
]

const filtrosPedido = [
  { valor: 'todos', etiqueta: 'Todos' },
  { valor: 'pendiente', etiqueta: 'Pendientes' },
  { valor: 'en preparación', etiqueta: 'En preparación' },
  { valor: 'en camino', etiqueta: 'En camino' },
  { valor: 'entregado', etiqueta: 'Entregados' },
  { valor: 'cancelado', etiqueta: 'Cancelados' },
]

export default function App() {
  const [apiStatus, setApiStatus] = useState('Comprobando API…')
  const [pestanaActiva, setPestanaActiva] = useState('inicio')
  const [pedidos, setPedidos] = useState([])
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [carrito, setCarrito] = useState([])
  const [cargando, setCargando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [actualizandoEstado, setActualizandoEstado] = useState(null)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [nuevoNombre, setNuevoNombre] = useState('')
const [nuevaDescripcion, setNuevaDescripcion] = useState('')
const [nuevoPrecio, setNuevoPrecio] = useState('')
const [nuevaCategoria, setNuevaCategoria] = useState('')
const [nuevaImagen, setNuevaImagen] = useState('')
const [guardandoProducto, setGuardandoProducto] = useState(false)
const [mensajeProducto, setMensajeProducto] = useState('')
const [errorProducto, setErrorProducto] = useState('')


  const [clienteId, setClienteId] = useState('1')
  const [direccion, setDireccion] = useState('')
  const [total, setTotal] = useState('')


  async function agregarProducto(event) {
  event.preventDefault()

  const precio = Number(nuevoPrecio)
  const categoriaId = Number(nuevaCategoria)

  if (!nuevoNombre.trim()) {
    setErrorProducto('El nombre del producto es obligatorio.')
    return
  }

  if (!Number.isFinite(precio) || precio <= 0) {
    setErrorProducto('El precio debe ser mayor que cero.')
    return
  }

  if (!categoriaId) {
    setErrorProducto('Selecciona una categoría.')
    return
  }

  setGuardandoProducto(true)
  setErrorProducto('')
  setMensajeProducto('')

  try {
    const respuesta = await fetch(`${API_URL}/catalogo/productos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nombre: nuevoNombre.trim(),
        descripcion: nuevaDescripcion.trim(),
        precio,
        categoria_id: categoriaId,
        imagen_url: nuevaImagen.trim() || null,
        disponible: true,
      }),
    })

    const datos = await respuesta.json()

    if (!respuesta.ok) {
      throw new Error(
        typeof datos.detail === 'string'
          ? datos.detail
          : 'No fue posible guardar el producto.'
      )
    }

    const respuestaCatalogo = await fetch(
      `${API_URL}/catalogo/productos`
    )

    if (respuestaCatalogo.ok) {
      setProductos(await respuestaCatalogo.json())
    }

    setNuevoNombre('')
    setNuevaDescripcion('')
    setNuevoPrecio('')
    setNuevaCategoria('')
    setNuevaImagen('')
    setMensajeProducto('¡Producto agregado correctamente al catálogo!')
  } catch (error) {
    setErrorProducto(error.message || 'Error al guardar el producto.')
  } finally {
    setGuardandoProducto(false)
  }
}

  const agregarAlCarrito = (producto) => {
    if (!producto.disponible) return
    setCarrito((carritoActual) => {
      const productoExistente = carritoActual.find(
        (item) => item.id === producto.id
      )
      if (productoExistente) {
        return carritoActual.map((item) =>
          item.id === producto.id
        ? { ...item, cantidad: item.cantidad + 1 } : item
      )
    }
    return [...carritoActual, { ...producto, cantidad: 1 }]
  })
  setMensaje(`${producto.nombre} agregado al carrito.`)
  setError('')
}

const cambiarCantidadCarrito = (productoId, cambio) => {
  setCarrito((carritoActual) =>
    carritoActual
      .map((item) =>
        item.id === productoId
          ? { ...item, cantidad: item.cantidad + cambio }
          : item
      )
      .filter((item) => item.cantidad > 0)
  )
}

const eliminarDelCarrito = (productoId) => {
  setCarrito((carritoActual) =>
    carritoActual.filter((item) => item.id !== productoId)
  )
}


const crearPedidoDesdeCarrito = async () => {
  if (carrito.length === 0) {
    setError('Agrega al menos un producto al carrito.')
    setMensaje('')
    return
  }

  if (!direccion.trim() || direccion.trim().length < 5) {
    setError('Escribe una dirección de entrega válida.')
    setMensaje('')
    return
  }

  setGuardando(true)
  setError('')
  setMensaje('')

  try {
    const respuesta = await fetch(`${API_URL}/pedidos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cliente_id: Number(clienteId),
        direccion_entrega: direccion.trim(),
        productos: carrito.map((item) => ({
          producto_id: item.id,
          cantidad: item.cantidad,
        })),
      }),
    })

    const datos = await respuesta.json()

    if (!respuesta.ok) {
      throw new Error(
        datos.detail || 'No fue posible registrar el pedido.'
      )
    }

    setMensaje(`¡Pedido #${datos.id} registrado correctamente!`)
    setError('')
    setCarrito([])
    setDireccion('')

    await cargarPedidos()
    setPestanaActiva('pedidos')
  } catch (error) {
    setError(
      error.message || 'Ocurrió un error al registrar el pedido.'
    )
  } finally {
    setGuardando(false)
  }
}


const totalCarrito = carrito.reduce(
  (suma, item) => suma + Number(item.precio) * item.cantidad,
  0
)


  const pedidosFiltrados =
    filtroEstado === 'todos'
      ? pedidos
      : pedidos.filter((pedido) => pedido.estado === filtroEstado)

  const cargarPedidos = useCallback(async () => {
    setCargando(true)
    setError('')

   
    try {
      const response = await fetch(`${API_URL}/pedidos`)

      if (!response.ok) {
        throw new Error('No se pudieron consultar los pedidos.')
      }

      const data = await response.json()
      setPedidos(data)
    } catch (err) {
      setError(err.message || 'No fue posible conectar con el backend.')
    } finally {
      setCargando(false)
    }
  }, [])
  
  const cargarCatalogo = useCallback(async () => {
    try {
      const [respuestaProductos, respuestaCategorias] = await Promise.all([
        fetch(`${API_URL}/catalogo/productos`),
        fetch(`${API_URL}/catalogo/categorias`),
      ])

      if (!respuestaProductos.ok || !respuestaCategorias.ok) {
        throw new Error('No fue posible cargar el catálogo.')
      }

      const [datosProductos, datosCategorias] = await Promise.all([
        respuestaProductos.json(),
        respuestaCategorias.json(),
      ])

      setProductos(datosProductos)
      setCategorias(datosCategorias)
    } catch (err) {
      console.error('Error al cargar el catálogo:', err)
    }
  }, [])

  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then((response) => {
        if (!response.ok) throw new Error('API no disponible')
        return response.json()
      }) 
      .then((data) => {
        setApiStatus(data.message || 'API conectada')
      })
      .catch(() => {
        setApiStatus('API no conectada. Inicia el backend.')
      }) 
    cargarPedidos()
    cargarCatalogo()               
  }, [cargarPedidos, cargarCatalogo])
  async function crearPedido(event) {
    event.preventDefault()
    setMensaje('') 
    setError('')

    const cliente = Number(clienteId)
    const importe = Number(total)

    if (!Number.isInteger(cliente) || cliente <= 0) {
      setError('El identificador del cliente debe ser un entero positivo.')
      return
    }

    if (!direccion.trim() || direccion.trim().length < 5) {
      setError('Escribe una dirección de entrega de al menos 5 caracteres.')
      return
    }

    if (!Number.isFinite(importe) || importe <= 0) {
      setError('El total debe ser un número mayor que cero.')
      return
    }

    setGuardando(true)

    try {
      const response = await fetch(`${API_URL}/pedidos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente_id: cliente,
          direccion_entrega: direccion.trim(),
          total: importe,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(
          typeof data.detail === 'string'
            ? data.detail
            : 'No fue posible registrar el pedido.'
        )
      }

      const nuevoPedido = await response.json()

      setMensaje(`¡Pedido #${nuevoPedido.id} registrado correctamente!`)
      setDireccion('')
      setTotal('')
      setFiltroEstado('todos')
      await cargarPedidos()
    } catch (err) {
      setError(err.message || 'Ocurrió un error al registrar el pedido.')
    } finally {
      setGuardando(false)
    }
  }

  async function cambiarEstado(pedidoId, nuevoEstado) {
    setError('')
    setMensaje('')
    setActualizandoEstado(pedidoId)

    try {
      const response = await fetch(
        `${API_URL}/pedidos/${pedidoId}/estado`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ estado: nuevoEstado }),
        }
      )

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(
          typeof data.detail === 'string'
            ? data.detail
            : 'No fue posible actualizar el estado.'
        )
      }

      setMensaje(
        `Estado del pedido #${pedidoId} actualizado correctamente.`
      )
      await cargarPedidos()
    } catch (err) {
      setError(err.message || 'Ocurrió un error al actualizar el estado.')
    } finally {
      setActualizandoEstado(null)
    }
  }

  function formatoFecha(fecha) {
    if (!fecha) return 'No disponible'

    const fechaValida = new Date(fecha)

    if (Number.isNaN(fechaValida.getTime())) return fecha

    return fechaValida.toLocaleString('es-SV')
  }

  return (
    
<main className="page-shell">
  <aside className="sidebar">
    <a
      className="brand"
      href="#"
      aria-label="Delivery Express inicio"
      onClick={(event) => {
        event.preventDefault()
        setPestanaActiva('inicio')
      }}
    >
      <span className="brand-mark">
        <UtensilsCrossed size={22} />
      </span>
      <span>
        Delivery <b>Express</b>
      </span>
    </a>

    <div className="sidebar-heading">MENÚ PRINCIPAL</div>

    <nav className="nav-tabs" aria-label="Navegación principal">
      <button
        type="button"
        className={`nav-tab ${pestanaActiva === 'inicio' ? 'active' : ''}`}
        onClick={() => setPestanaActiva('inicio')}
      >
        <UtensilsCrossed size={18} />
        <span>Inicio</span>
      </button>

      <button
        type="button"
        className={`nav-tab ${pestanaActiva === 'catalogo' ? 'active' : ''}`}
        onClick={() => setPestanaActiva('catalogo')}
      >
        <ShoppingBag size={18} />
        <span>Catálogo</span>
      </button>

      <button
        type="button"
        className={`nav-tab ${pestanaActiva === 'pedidos' ? 'active' : ''}`}
        onClick={() => setPestanaActiva('pedidos')}
      >
        <ClipboardList size={18} />
        <span>Pedidos</span>
      </button>

      <button
        type="button"
        className={`nav-tab ${pestanaActiva === 'administracion' ? 'active' : ''}`}
        onClick={() => setPestanaActiva('administracion')}
      >
        <ListFilter size={18} />
        <span>Administración</span>
      </button>

      <button
        type="button"
        className={`nav-tab ${pestanaActiva === 'repartidores' ? 'active' : ''}`}
        onClick={() => setPestanaActiva('repartidores')}
      >
        <Bike size={18} />
        <span>Repartidores</span>
      </button>
    </nav>

    <div className="sidebar-footer">
      <span
        className={
          apiStatus.toLowerCase().includes('no conectada')
            ? 'status-dot'
            : 'status-dot online'
        }
      />
      <span>{apiStatus}</span>
    </div>
  </aside>

  <div className="main-content">
      
      {pestanaActiva === 'inicio' && ( <>
          <section className="hero hero-reference">
            <div
              className="hero-visual hero-visual-integrated"
              aria-hidden="true"
            >
              <img
                className="hero-reference-image"
                src="/hero-delivery.jpg"
                alt=""
              />
            </div>

            <div className="hero-copy">
              <p className="eyebrow">
                PEDIDOS · ADMINISTRACIÓN · ENTREGAS
              </p>

              <h1>
                Todo tu delivery,
                <br />
                <span>en un solo lugar.</span>
              </h1>

              <p className="hero-description">
                Una plataforma para organizar pedidos, administrar productos
                y coordinar las entregas a domicilio.
              </p>

              <div className="hero-actions">
                <button
                  className="primary-button"
                  type="button"
                  onClick={() => setPestanaActiva('pedidos')}
                >
                  Gestionar pedidos
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            </div>
          </section>
          <section id="modulos" className="modules-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">PLATAFORMA</p>
                <h2>Módulos del sistema</h2>
              </div>
              <p>Un espacio de trabajo para cada tipo de usuario.</p>
              </div>
              <div className="module-grid">
                {roles.map(({ title, description, icon: Icon, tag }) => (
                  <article className="module-card" key={title}><div className="module-icon">
                    <Icon size={23} />
                    </div>
                    <span className="module-tag">{tag}</span>
                    <h3>{title}</h3>
                    <p>{description}</p>
                    <button className="module-status" type="button" onClick={() => setPestanaActiva('pedidos')}> Ir a pedidos <span>↗</span></button>
                    </article>
                  ))}
                  </div>
                  </section>
          </>
      )}      
      {/* CATÁLOGO DE PRODUCTOS */}
      {pestanaActiva === 'catalogo' && (<>
      <section className="catalog-section">
        <div className="section-heading section-heading-modern">
          <div className="section-title-group">
            <p className="eyebrow">NUESTRO MENÚ</p>
            <h2>Catálogo de productos</h2>
            <p>Explora las categorías y descubre lo que puedes pedir.</p>
            </div>
            <button type="button" className="refresh-button" onClick={cargarCatalogo} title="Actualizar catálogo">
              <RefreshCw size={18} /> Actualizar
            </button>
        </div>
        <div className="catalog-categories">
          {categorias.map((categoria) => (
            <div className="category-card" key={categoria.id}>
              <span className="category-icon">
                <UtensilsCrossed size={22} />
              </span>
              <div>
                <h3>{categoria.nombre}</h3>
                <p>{categoria.descripcion}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="catalog-products-by-category">
          {categorias.map((categoria) => {
            const productosCategoria = productos.filter(
              (producto) =>
                Number(producto.categoria_id) === Number(categoria.id)
            )
            if (productosCategoria.length === 0) {
              return null
             }
             return (
               <section className="catalog-category-section" key={categoria.id} >
                <div className="catalog-category-heading">
                  <div>
                    <span className="eyebrow">NUESTRO MENÚ</span>
                      <h3>{categoria.nombre}</h3>
                    <p>{categoria.descripcion}</p>
                  </div>
                  <span className="catalog-category-count">
                    {productosCategoria.length}{' '}
                     {productosCategoria.length === 1
                     ? 'producto'
                     : 'productos'}
                 </span>
                </div>
                
                <div className="product-grid">
                  {productosCategoria.map((producto) => (
                    <article className="product-card" key={producto.id}>
                   <div className="product-image-placeholder"> <ShoppingBag size={34} className="product-image-fallback" />
                   {producto.imagen_url && (
                    <img src={producto.imagen_url} alt={producto.nombre} className="product-image" onError={(event) => {
                      event.currentTarget.style.display = 'none'
                    }}/>
                    )}
                    </div>
                   <div className="product-content"> <span className="product-category"> {categoria.nombre} </span>
                      <h3>{producto.nombre}</h3>
                    <p> {producto.descripcion || 'Delicioso y preparado para ti.'} </p>

                    <div className="product-footer">
                      <strong> ${Number(producto.precio).toFixed(2)} </strong>
                      <button type="button" className="add-to-cart-button" disabled={!producto.disponible} onClick={() => agregarAlCarrito(producto)}>
                        <PlusCircle size={18} /> Agregar </button>
                        </div>

                       </div>
                       </article>
                      ))}
                    </div>
                    </section>)
                  })}
        </div>
        
        <section className="cart-section">
          <div className="cart-heading">
            <div>
              <p className="eyebrow">TU COMPRA</p>
              <h2>Mi carrito</h2>
            </div>

            <span className="cart-count">
              {carrito.reduce((suma, item) => suma + item.cantidad, 0)} productos
            </span>
          </div>

          {carrito.length === 0 ? (
            <p className="cart-empty">
              Tu carrito está vacío. Agrega tus productos favoritos del menú.
            </p>
          ) : (
            <>
              <div className="cart-items">
                {carrito.map((item) => (
                  <article className="cart-item" key={item.id}>
                    <div className="cart-item-info">
                      <h3>{item.nombre}</h3>
                      <p>
                        ${Number(item.precio).toFixed(2)} por unidad
                      </p>
                    </div>

                    <div className="cart-item-actions">
                      <button
                        type="button"
                        onClick={() => cambiarCantidadCarrito(item.id, -1)}
                        aria-label={`Disminuir cantidad de ${item.nombre}`}
                      >
                        −
                      </button>

                      <span>{item.cantidad}</span>

                      <button
                        type="button"
                        onClick={() => cambiarCantidadCarrito(item.id, 1)}
                        aria-label={`Aumentar cantidad de ${item.nombre}`}
                      >
                        +
                      </button>
                    </div>

                    <strong className="cart-item-subtotal">
                      ${(Number(item.precio) * item.cantidad).toFixed(2)}
                    </strong>

                    <button
                      type="button"
                      className="cart-remove-button"
                      onClick={() => eliminarDelCarrito(item.id)}
                    >
                      Eliminar
                    </button>
                  </article>
                ))}
              </div>

              
<div className="cart-summary">
  <span>Total de la compra</span>
  <strong>${totalCarrito.toFixed(2)}</strong>
</div>

<div className="cart-checkout">
  <label htmlFor="direccion-entrega">
    Dirección de entrega
  </label>

  <input
    id="direccion-entrega"
    type="text"
    value={direccion}
    onChange={(event) => setDireccion(event.target.value)}
    placeholder="Dirección de entrega"
    maxLength={300}
  />

  <button
    type="button"
    onClick={crearPedidoDesdeCarrito}
    disabled={guardando || carrito.length === 0}
  >
    {guardando ? 'Procesando pedido...' : 'Confirmar compra'}
  </button>
</div>

            </>
          )}
        </section>

      </section>
      </>)}
      {pestanaActiva === 'pedidos' && (<>
      <section id="pedidos" className="orders-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">GESTIÓN DE PEDIDOS</p>
            <h2>Registrar un pedido</h2>
          </div>

          <p>Los datos se guardan en la base de datos del sistema.</p>
        </div>

        <form className="order-form" onSubmit={crearPedido}>
          <div className="form-field">
            <label htmlFor="clienteId">ID del cliente</label>
            <input
              id="clienteId"
              type="number"
              min="1"
              step="1"
              value={clienteId}
              onChange={(event) => setClienteId(event.target.value)}
              required
            />
            <small>
              Por ahora utilizamos el cliente de prueba número 1.
            </small>
          </div>

          <div className="form-field">
            <label htmlFor="direccion">Dirección de entrega</label>
            <input
              id="direccion"
              type="text"
              minLength="5"
              maxLength="300"
              placeholder="Dirección de entrega"
              value={direccion}
              onChange={(event) => setDireccion(event.target.value)}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="total">Total del pedido ($)</label>
            <input
              id="total"
              type="number"
              min="0.01"
              max="99999999.99"
              step="0.01"
              placeholder="Ej. 12.50"
              value={total}
              onChange={(event) => setTotal(event.target.value)}
              required
            />
          </div>

          <button
            className="primary-button form-submit"
            type="submit"
            disabled={guardando}
          >
            <PlusCircle size={18} />
            {guardando ? 'Guardando…' : 'Registrar pedido'}
          </button>
        </form>

        {mensaje && (
          <p className="feedback success-message" role="status">
            {mensaje}
          </p>
        )}

        {error && (
          <p className="feedback error-message" role="alert">
            {error}
          </p>
        )}

        <div className="orders-heading">
          <div>
            <p className="eyebrow">BASE DE DATOS</p>
            <h2>Pedidos registrados ({pedidos.length})</h2>
          </div>

          <button
            className="secondary-button"
            type="button"
            onClick={cargarPedidos}
            disabled={cargando}
          >
            <RefreshCw size={16} />
            {cargando ? 'Actualizando…' : 'Actualizar'}
          </button>
        </div>

        <div className="order-filters">
          <div className="filter-heading">
            <ListFilter size={18} />
            <span>Filtrar por estado</span>
          </div>

          <div className="filter-options">
            {filtrosPedido.map((filtro) => {
              const cantidad =
                filtro.valor === 'todos'
                  ? pedidos.length
                  : pedidos.filter(
                      (pedido) => pedido.estado === filtro.valor
                    ).length

              return (
                <button
                  key={filtro.valor}
                  type="button"
                  className={`filter-button ${
                    filtroEstado === filtro.valor ? 'active' : ''
                  }`}
                  onClick={() => setFiltroEstado(filtro.valor)}
                  aria-pressed={filtroEstado === filtro.valor}
                >
                  {filtro.etiqueta}
                  <span className="filter-count">{cantidad}</span>
                </button>
              )
            })}
          </div>

          <p className="filter-summary">
            Mostrando <strong>{pedidosFiltrados.length}</strong> de{' '}
            <strong>{pedidos.length}</strong> pedidos.
          </p>
        </div>

        {cargando && pedidos.length === 0 ? (
          <p className="empty-state">Cargando pedidos…</p>
        ) : pedidosFiltrados.length === 0 ? (
          <p className="empty-state">
            {pedidos.length === 0
              ? 'Todavía no hay pedidos registrados.'
              : 'No hay pedidos con este estado.'}
          </p>
        ) : (
          <div className="orders-table-wrapper">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Cliente</th>
                  <th>Dirección</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Fecha de creación</th>
                </tr>
              </thead>

              <tbody>
                {pedidosFiltrados.map((pedido) => (
                  <tr key={pedido.id}>
                    <td>#{pedido.id}</td>
                    <td>{pedido.cliente_id}</td>
                    <td>{pedido.direccion_entrega}</td>
                    <td>${Number(pedido.total).toFixed(2)}</td>
                    <td>
                      <select
                        className={`order-status-select estado-${pedido.estado.replaceAll(' ', '-')}`}
                        value={pedido.estado}
                        disabled={actualizandoEstado === pedido.id}
                        onChange={(event) =>
                          cambiarEstado(pedido.id, event.target.value)
                        }
                        aria-label={`Cambiar estado del pedido ${pedido.id}`}
                      >
                        {estadosPedido.map((estado) => (
                          <option key={estado} value={estado}>
                            {estado.charAt(0).toUpperCase() +
                              estado.slice(1)}
                          </option>
                        ))}
                      </select>

                      {actualizandoEstado === pedido.id && (
                        <small className="saving-status">Guardando…</small>
                      )}
                    </td>
                    <td>{formatoFecha(pedido.fecha_creacion)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      </> )}

            {pestanaActiva === 'administracion' && (
        <section className="workspace-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">PANEL DE CONTROL</p>
              <h2>Administración</h2>
            </div>
            <p>Gestiona los productos y supervisa las operaciones de Delivery Express.</p>
          </div>

          <div className="workspace-grid">
            <article className="module-card">
              <div className="module-icon">
                <ShoppingBag size={23} />
              </div>
              <h3>Agregar producto</h3>
              <p>Registra nuevos productos en el catálogo.</p>

              <form onSubmit={agregarProducto} className="product-form">
                <label htmlFor="nuevo-nombre">Nombre del producto</label>
                <input
                  id="nuevo-nombre"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  placeholder="Ej. Hamburguesa especial"
                  required
                />

                <label htmlFor="nueva-descripcion">Descripción</label>
                <textarea
                  id="nueva-descripcion"
                  value={nuevaDescripcion}
                  onChange={(e) => setNuevaDescripcion(e.target.value)}
                  placeholder="Describe el producto"
                  rows={3}
                />

                <label htmlFor="nuevo-precio">Precio ($)</label>
                <input
                  id="nuevo-precio"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={nuevoPrecio}
                  onChange={(e) => setNuevoPrecio(e.target.value)}
                  placeholder="Ej. 5.99"
                  required
                />

                <label htmlFor="nueva-categoria">Categoría</label>
                <select
                  id="nueva-categoria"
                  value={nuevaCategoria}
                  onChange={(e) => setNuevaCategoria(e.target.value)}
                  required
                >
                  <option value="">Selecciona una categoría</option>
                  {categorias.map((categoria) => (
                    <option key={categoria.id} value={categoria.id}>
                      {categoria.nombre}
                    </option>
                  ))}
                </select>

                <label htmlFor="nueva-imagen">URL de imagen (opcional)</label>
                <input
                  id="nueva-imagen"
                  type="url"
                  value={nuevaImagen}
                  onChange={(e) => setNuevaImagen(e.target.value)}
                  placeholder="https://ejemplo.com/imagen.jpg"
                />

                {mensajeProducto && (
                  <p className="success-message">{mensajeProducto}</p>
                )}

                {errorProducto && (
                  <p className="error-message">{errorProducto}</p>
                )}

                <button
                  className="primary-button"
                  type="submit"
                  disabled={guardandoProducto}
                >
                  {guardandoProducto ? 'Guardando...' : 'Agregar producto'}
                </button>
              </form>
            </article>

            <article className="module-card">
              <div className="module-icon">
                <ClipboardList size={23} />
              </div>
              <h3>Gestión de pedidos</h3>
              <p>Consulta los pedidos y actualiza sus estados.</p>
              <button
                className="module-status"
                type="button"
                onClick={() => setPestanaActiva('pedidos')}
              >
                Ver pedidos <span>↗</span>
              </button>
            </article>
          </div>
        </section>
      )}

      {pestanaActiva === 'repartidores' && (
        <section className="workspace-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">CENTRO DE ENTREGAS</p>
              <h2>Portal del repartidor</h2>
            </div>
            <p>Espacio destinado al seguimiento de las entregas.</p>
          </div>

          <div className="workspace-grid">
            <article className="module-card">
              <div className="module-icon">
                <Bike size={23} />
              </div>
              <h3>Entregas asignadas</h3>
              <p>
                Aquí incorporaremos la consulta de pedidos asignados
                a cada repartidor.
              </p>
              <span className="module-tag">Próximamente</span>
            </article>

            <article className="module-card">
              <div className="module-icon">
                <ClipboardList size={23} />
              </div>
              <h3>Estado de las entregas</h3>
              <p>
                Aquí incorporaremos la actualización y el seguimiento
                de las entregas.
              </p>
              <span className="module-tag">Próximamente</span>
            </article>
          </div>
        </section>
      )}

      <footer className="footer">
        <span>© Delivery Express </span>

        <span className="api-status">
          <span
            className={
              apiStatus.toLowerCase().includes('no conectada')
                ? 'status-dot'
                : 'status-dot online'
            }
          />
          {apiStatus}
        </span>
            </footer>
      </div>
    </main>
  )
}
