DROP DATABASE IF EXISTS tienda_cipa;
CREATE DATABASE tienda_cipa;

use tienda_cipa;

create table tipo_documento(
	id int auto_increment primary key,
	nombre_tipo_documento varchar(30) not null
);

create table municipio(
	id int auto_increment primary key,
	nombre_municipio varchar(100) not null
);

create table medio_pago(
	id int auto_increment primary key,
	nombre_medio_pago varchar(50) not null
);

create table cliente(
	id int auto_increment primary key,
	nombre_cliente varchar(80) not null,
	direccion_cliente varchar(100) not null,
	genero_cliente enum('femenino', 'masculino'),
	numero_documento varchar(20) not null unique,
	id_tipo_documento int not null,
	id_municipio int not null,
	fecha_nacimiento DATE,  -- **Nuevo: Para segmentación por edad en BI**
    email VARCHAR(100),     -- **Nuevo: Para marketing y unicidad**
	FOREIGN KEY (id_tipo_documento) REFERENCES tipo_documento(id),
	FOREIGN KEY (id_municipio) REFERENCES municipio(id)
)

create table telefono(
	id int auto_increment primary key,
	numero_telefono varchar(20),
	tipo_telefono ENUM('movil', 'fijo', 'trabajo'),
	ubicacion_telefono varchar(30),
	id_cliente int not null,
	FOREIGN KEY (id_cliente) REFERENCES cliente(id)
)

create table venta(
	numero_venta int auto_increment primary key,
	fecha_venta TIMESTAMP not null,
	tipo_venta ENUM('efectivo', 'credito', 'online','debito'),
	total_venta DECIMAL(10,2) NOT NULL DEFAULT 0.00,
	id_cliente int not null,
	FOREIGN KEY (id_cliente) REFERENCES cliente(id)
)

create table detalle_venta(
	id int auto_increment primary key,
	codigo_producto int not null,
	item varchar(50) not null,
	precio_unitario DECIMAL(10,2) NOT NULL,  -- **Nuevo: Precio al momento de venta (histórico)**
    subtotal DECIMAL(10,2) NOT NULL,
	numero_venta int not null,
	FOREIGN KEY (numero_venta) REFERENCES venta(numero_venta),
	FOREIGN KEY (codigo_producto) REFERENCES producto(codigo_producto)
)

create table tipo_producto(
	id int auto_increment primary key,
	nombre_tipo_producto varchar(100) not null 
)

create table unidad_medida(
	id int auto_increment primary key,
	nombre_unidad_medida varchar(50) not null
)

create table producto(
	codigo_producto int auto_increment primary key,
	id_tipo_producto int not null,
	id_unidad_medida int not null,
	nombre_producto VARCHAR(100) NOT NULL,
    precio_venta DECIMAL(10,2) NOT NULL,  -- **Nuevo: Precio de venta**
    costo DECIMAL(10,2) NOT NULL,         -- **Nuevo: Costo para calcular ganancias**
    stock INT NOT NULL DEFAULT 0,
	FOREIGN KEY (id_tipo_producto) REFERENCES tipo_producto(id),
	FOREIGN key (id_unidad_medida) REFERENCES unidad_medida(id)
)

create table entidad_financiera(
	id int auto_increment primary key,
	nombre_entidad_financiera varchar(100) not null
)

create table pago(
	id int auto_increment primary key,
	fecha_pago TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	id_entidad_financiera int not null,
	monto DECIMAL(10,2) NOT NULL,  -- **Nuevo: Monto pagado**
	id_medio_pago int not null,
	numero_venta int not null,
	FOREIGN KEY (id_entidad_financiera) REFERENCES entidad_financiera(id),
	FOREIGN KEY (id_medio_pago) REFERENCES medio_pago(id),
	FOREIGN KEY (numero_venta) REFERENCES venta(numero_venta)
)


INSERT INTO tipo_documento (nombre_tipo_documento) VALUES
('Cédula de Ciudadanía'),
('Tarjeta de Identidad'),
('Cédula de Extranjería'),
('Pasaporte'),
('Registro Civil');


INSERT INTO municipio (nombre_municipio) VALUES
('Ibagué'), ('Cali'), ('Medellín'), ('Bogotá'), ('Pereira'), ('Manizales'), ('Armenia'), ('Bucaramanga'),
('Barranquilla'), ('Cartagena'), ('Santa Marta'), ('Cúcuta'), ('Villavicencio'), ('Neiva'), ('Pasto'),
('Popayán'), ('Tunja'), ('Riohacha'), ('Montería'), ('Sincelejo'), ('Yopal'), ('Mocoa'), ('Arauca'),
('Quibdó'), ('Florencia'), ('San Andrés'), ('Soledad'), ('Envigado'), ('Dosquebradas'), ('Girardot');

INSERT INTO medio_pago (nome_medio_pago) VALUES
('Efectivo'), ('Tarjeta de Crédito'), ('Tarjeta de Débito'), ('Transferencia Bancaria'),
('Nequi'), ('Daviplata'), ('Cheque'), ('Bono de Despensa');


ALTER TABLE cliente
DROP FOREIGN KEY cliente_ibfk_2;

ALTER TABLE municipio
MODIFY COLUMN id INT AUTO_INCREMENT;

ALTER TABLE cliente
ADD CONSTRAINT cliente_ibfk_2
FOREIGN KEY (id_municipio) REFERENCES municipio(id);

INSERT INTO cliente (nombre_cliente, direccion_cliente, genero_cliente, numero_documento, id_tipo_documento, id_municipio, fecha_nacimiento, email) VALUES
('Ana María López', 'Calle 10 # 5-20, Barrio Belén', 'femenino', '1010100001', 1, 1, '1985-04-15', 'anamaria.l@email.com'),
('Carlos Restrepo', 'Carrera 8 # 12-50, Centro', 'masculino', '1010100002', 1, 2, '1990-09-20', 'carlos.r@email.com'),
('Laura Gómez', 'Avenida 30 # 7-10, El Salado', 'femenino', '1010100003', 1, 1, '2001-02-28', 'laura.g@email.com'),
('Juan David Pérez', 'Calle 50 # 15-30, Ciudad Salitre', 'masculino', '1010100004', 1, 4, '1975-11-05', 'j.perez@email.com'),
('Sofía Torres', 'Diagonal 25 # 9-45, Barrio Obrero', 'femenino', '1010100005', 1, 3, '1995-07-10', 's.torres@email.com'),
('Pedro Sánchez', 'Carrera 14 # 20-10, La Granja', 'masculino', '1010100006', 1, 5, '1988-03-22', 'pedro.s@email.com'),
('Valeria Ortiz', 'Calle 35 # 8-5, El Campestre', 'femenino', '1010100007', 1, 6, '1999-12-01', 'valeria.o@email.com'),
('Andrés Castro', 'Avenida 20 # 1-1, La Castellana', 'masculino', '1010100008', 1, 7, '1970-06-30', 'andres.c@email.com'),
('Isabella Vargas', 'Calle 100 # 50-60, El Poblado', 'femenino', '1010100009', 1, 3, '1992-08-18', 'isabella.v@email.com'),
('Santiago Herrera', 'Carrera 7 # 15-20, Centro', 'masculino', '1010100010', 1, 4, '2005-01-25', 'santiago.h@email.com'),
('Gabriela Acosta', 'Diagonal 10 # 2-30, Salitre', 'femenino', '1010100011', 1, 4, '1993-05-12', 'gabriela.a@email.com'),
('Felipe Giraldo', 'Calle 11 # 1-1, Prado', 'masculino', '1010100012', 1, 5, '1980-11-20', 'felipe.g@email.com'),
('Daniela Morales', 'Carrera 23 # 45-67, Manizales', 'femenino', '1010100013', 1, 6, '1997-04-03', 'daniela.m@email.com'),
('Mateo Ríos', 'Calle 70 # 3-45, El Centro', 'masculino', '1010100014', 1, 7, '1982-09-08', 'mateo.r@email.com'),
('Camila Valencia', 'Avenida 80 # 20-50, Laureles', 'femenino', '1010100015', 1, 3, '1994-01-19', 'camila.v@email.com'),
('Pablo Escobar', 'Calle 100 # 8-10, Teusaquillo', 'masculino', '1010100016', 1, 4, '1978-02-14', 'pablo.e@email.com'),
('Mariana Jaramillo', 'Carrera 15 # 2-5, Belén', 'femenino', '1010100017', 1, 1, '1996-03-28', 'mariana.j@email.com'),
('Ricardo Pardo', 'Calle 30 # 10-20, La Floresta', 'masculino', '1010100018', 1, 2, '1989-10-10', 'ricardo.p@email.com'),
('Luciana Ríos', 'Avenida 40 # 5-6, Pijao', 'femenino', '1010100019', 1, 1, '2000-06-25', 'luciana.r@email.com'),
('Diego Fernández', 'Carrera 50 # 30-15, Kennedy', 'masculino', '1010100020', 1, 4, '1983-07-07', 'diego.f@email.com'),
('Laura Castro', 'Calle 22 # 11-12, Centro', 'femenino', '1010100021', 1, 5, '1991-08-16', 'laura.c@email.com'),
('Julián Pérez', 'Avenida 25 # 2-30, Circunvalar', 'masculino', '1010100022', 1, 6, '1977-09-29', 'julian.p@email.com'),
('Andrea López', 'Calle 5 # 30-40, La Quinta', 'femenino', '1010100023', 1, 7, '1998-11-04', 'andrea.l@email.com'),
('Fabián Martínez', 'Carrera 1 # 1-1, La Granja', 'masculino', '1010100024', 1, 8, '1986-12-11', 'fabian.m@email.com'),
('Paola Vargas', 'Avenida 3 # 2-3, Prado Alto', 'femenino', '1010100025', 1, 9, '1990-02-02', 'paola.v@email.com'),
('David Ramírez', 'Calle 10 # 5-6, Santa Fe', 'masculino', '1010100026', 1, 10, '1984-03-09', 'david.r@email.com'),
('Carolina Gutiérrez', 'Diagonal 2 # 3-4, El Lago', 'femenino', '1010100027', 1, 11, '1993-04-18', 'carolina.g@email.com'),
('Jorge Soto', 'Carrera 4 # 5-6, El Centro', 'masculino', '1010100028', 1, 12, '1976-05-23', 'jorge.s@email.com'),
('Tatiana Franco', 'Calle 6 # 7-8, La Estrella', 'femenino', '1010100029', 1, 13, '1995-06-30', 'tatiana.f@email.com'),
('Luis Miguel', 'Avenida 7 # 8-9, El Pinar', 'masculino', '1010100030', 1, 14, '1987-07-04', 'luis.m@email.com');




INSERT INTO telefono (numero_telefono, tipo_telefono, ubicacion_telefono, id_cliente) VALUES
('3101234567', 'movil', 'Celular Ana', 1), ('3209876543', 'movil', 'Celular Carlos', 2),
('6082645151', 'fijo', 'Casa Laura', 3), ('3151231234', 'movil', 'Celular Juan', 4),
('3005558899', 'movil', 'Celular Sofía', 5), ('3147890123', 'movil', 'Celular Pedro', 6),
('3012345678', 'movil', 'Celular Valeria', 7), ('3123456789', 'movil', 'Celular Andrés', 8),
('3189012345', 'movil', 'Celular Isabella', 9), ('3198765432', 'movil', 'Celular Santiago', 10),
('3201112233', 'movil', 'Celular Gabriela', 11), ('3134445566', 'movil', 'Celular Felipe', 12),
('3027778899', 'movil', 'Celular Daniela', 13), ('3178889900', 'movil', 'Celular Mateo', 14),
('3160001122', 'movil', 'Celular Camila', 15), ('3109998877', 'movil', 'Celular Pablo', 16),
('3115554433', 'movil', 'Celular Mariana', 17), ('3152223344', 'movil', 'Celular Ricardo', 18),
('3045556677', 'movil', 'Celular Luciana', 19), ('3123334455', 'movil', 'Celular Diego', 20),
('3196667788', 'movil', 'Celular Laura', 21), ('3005556677', 'movil', 'Celular Julián', 22),
('3152223344', 'movil', 'Celular Andrea', 23), ('3012345678', 'movil', 'Celular Fabián', 24),
('3147890123', 'movil', 'Celular Paola', 25), ('3189012345', 'movil', 'Celular David', 26),
('3198765432', 'movil', 'Celular Carolina', 27), ('3201112233', 'movil', 'Celular Jorge', 28),
('3134445566', 'movil', 'Celular Tatiana', 29), ('3027778899', 'movil', 'Celular Luis', 30);


INSERT INTO tipo_producto (nombre_tipo_producto) VALUES
('Alimentos procesados'), ('Bebidas'), ('Lácteos y huevos'), ('Aseo y hogar'), ('Carnes frías'),
('Frutas y verduras'), ('Panadería'), ('Snacks'), ('Dulces y confites'), ('Cigarrillos y tabaco');


INSERT INTO unidad_medida (nombre_unidad_medida) VALUES
('Unidad'), ('Gramo'), ('Mililitro'), ('Kilogramo'), ('Litro'), ('Paquete'), ('Bolsa'), ('Caja');

INSERT INTO producto (id_tipo_producto, id_unidad_medida, nombre_producto, precio_venta, costo, stock) VALUES
(1, 1, 'Galletas Ducales', 2500.00, 1500.00, 50),
(2, 5, 'Coca Cola 1.5L', 6000.00, 4000.00, 30),
(3, 1, 'Leche Alquería 1L', 4500.00, 3000.00, 40),
(4, 1, 'Jabón Ariel 500g', 8500.00, 6000.00, 25),
(5, 4, 'Salchichón Zenú 500g', 10000.00, 7500.00, 15),
(6, 4, 'Banano', 2000.00, 1200.00, 20),
(7, 6, 'Pan tajado Bimbo', 5500.00, 3800.00, 18),
(8, 7, 'Papas Margarita Pollo', 3000.00, 1800.00, 60),
(9, 1, 'Bom Bom Bum', 500.00, 250.00, 100),
(10, 1, 'Cigarrillos Marlboro', 10000.00, 7000.00, 20),
(1, 1, 'Chocolatina Jet', 1500.00, 800.00, 90),
(2, 5, 'Jugo de Naranja 1L', 3000.00, 2000.00, 35),
(3, 1, 'Yogurt Alpina 1L', 6000.00, 4000.00, 25),
(4, 1, 'Crema Dental Colgate', 4000.00, 2500.00, 45),
(5, 4, 'Queso Pera 250g', 7500.00, 5000.00, 12),
(1, 1, 'Ponqué Ramo', 4000.00, 2500.00, 22),
(2, 3, 'Gaseosa Sprite 350ml', 2000.00, 1200.00, 50),
(3, 1, 'Huevos Cubeta x 30', 18000.00, 12000.00, 10),
(4, 1, 'Papel Higiénico Familia', 15000.00, 10000.00, 15),
(5, 4, 'Jamón de Cerdo', 12000.00, 8000.00, 8),
(1, 1, 'Atún Van Camp´s', 5500.00, 3500.00, 30),
(2, 5, 'Agua Cristal 600ml', 1500.00, 800.00, 60),
(3, 1, 'Mantequilla Alpina 250g', 5000.00, 3200.00, 20),
(4, 1, 'Limpia Pisos Fabuloso', 7000.00, 4500.00, 18),
(5, 4, 'Chorizo Santarrosano', 9000.00, 6000.00, 10),
(1, 1, 'Arroz Diana 500g', 3000.00, 2000.00, 40),
(2, 5, 'Cerveza Aguila Lata', 3000.00, 2000.00, 50),
(3, 1, 'Cuajada La Cabaña', 8000.00, 5000.00, 10),
(4, 1, 'Desinfectante Lysol', 12000.00, 8000.00, 15),
(5, 4, 'Mortadela Zenú 500g', 9500.00, 6500.00, 12),
(1, 1, 'Café Sello Rojo 250g', 7000.00, 4500.00, 25),
(2, 5, 'Té Lipton Botella', 4000.00, 2500.00, 30),
(3, 1, 'Avena Alpina', 6500.00, 4000.00, 15),
(4, 1, 'Lavaplatos Axión', 5500.00, 3500.00, 20),
(5, 4, 'Bacon Ahumado', 15000.00, 10000.00, 8),
(6, 4, 'Pera', 3000.00, 1800.00, 25),
(7, 6, 'Pan de Yuca', 2500.00, 1500.00, 30),
(8, 7, 'Doritos', 3500.00, 2200.00, 40),
(9, 1, 'Gomitas Trululu', 2000.00, 1000.00, 60),
(10, 1, 'Cigarrillos Lucky Strike', 9000.00, 6000.00, 15),
(1, 1, 'Leche Condensada', 4500.00, 2800.00, 20),
(2, 5, 'Jugo Hit', 2500.00, 1500.00, 45),
(3, 1, 'Queso Mozzarella', 10000.00, 7000.00, 18),
(4, 1, 'Cloro Blanqueador', 4000.00, 2500.00, 25),
(5, 4, 'Jamón de Pollo', 8500.00, 5500.00, 14),
(1, 1, 'Azúcar 1kg', 6000.00, 4000.00, 30),
(2, 5, 'Té Hindú', 3000.00, 2000.00, 20),
(3, 1, 'Margarina La Fina', 4000.00, 2500.00, 22),
(4, 1, 'Suavizante Downy', 9000.00, 6000.00, 15),
(5, 4, 'Salami', 11000.00, 8000.00, 9);


ALTER TABLE detalle_venta
DROP FOREIGN KEY detalle_venta_ibfk_2;

ALTER TABLE producto
MODIFY COLUMN codigo_producto INT AUTO_INCREMENT;

ALTER TABLE detalle_venta
ADD CONSTRAINT detalle_venta_ibfk_2
FOREIGN KEY (codigo_producto) REFERENCES producto(codigo_producto);

INSERT INTO entidad_financiera (nombre_entidad_financiera) VALUES
('Bancolombia'), ('Davivienda'), ('BBVA'), ('Banco de Bogotá'), ('Banco Popular'),
('Banco de Occidente'), ('Banco Agrario'), ('Banco Caja Social');

INSERT INTO venta (fecha_venta, tipo_venta, total_venta, id_cliente) VALUES
('2025-09-19 10:30:00', 'efectivo', 8500.00, 1), ('2025-09-19 11:45:00', 'debito', 12000.00, 2),
('2025-09-18 15:00:00', 'credito', 25000.00, 3), ('2025-09-18 16:30:00', 'efectivo', 1500.00, 4),
('2025-09-17 09:00:00', 'debito', 7000.00, 5), ('2025-09-17 14:00:00', 'efectivo', 9000.00, 6),
('2025-09-16 12:00:00', 'credito', 11500.00, 7), ('2025-09-16 17:30:00', 'efectivo', 18000.00, 8),
('2025-09-15 10:15:00', 'debito', 2000.00, 9), ('2025-09-15 13:40:00', 'online', 6000.00, 10),
('2025-09-14 11:00:00', 'efectivo', 4500.00, 11), ('2025-09-14 16:00:00', 'credito', 15000.00, 12),
('2025-09-13 18:00:00', 'debito', 2500.00, 13), ('2025-09-13 10:00:00', 'efectivo', 5000.00, 14),
('2025-09-12 12:30:00', 'credito', 10000.00, 15), ('2025-09-12 14:45:00', 'online', 8000.00, 16),
('2025-09-11 09:00:00', 'efectivo', 6000.00, 17), ('2025-09-11 11:30:00', 'debito', 13000.00, 18),
('2025-09-10 16:00:00', 'credito', 20000.00, 19), ('2025-09-10 18:15:00', 'efectivo', 3500.00, 20),
('2025-09-09 10:00:00', 'debito', 9500.00, 21), ('2025-09-09 13:00:00', 'credito', 7500.00, 22),
('2025-09-08 15:30:00', 'efectivo', 14000.00, 23), ('2025-09-08 17:45:00', 'debito', 18000.00, 24),
('2025-09-07 11:00:00', 'online', 22000.00, 25), ('2025-09-07 14:00:00', 'efectivo', 4000.00, 26),
('2025-09-06 10:30:00', 'credito', 8000.00, 27), ('2025-09-06 12:15:00', 'debito', 1000.00, 28),
('2025-09-05 16:00:00', 'efectivo', 16000.00, 29), ('2025-09-05 18:30:00', 'online', 25000.00, 30),
('2025-09-04 10:00:00', 'efectivo', 7000.00, 1), ('2025-09-04 11:30:00', 'debito', 11000.00, 2),
('2025-09-03 15:00:00', 'credito', 19000.00, 3), ('2025-09-03 16:30:00', 'efectivo', 3000.00, 4),
('2025-09-02 09:00:00', 'online', 8000.00, 5), ('2025-09-02 14:00:00', 'debito', 10000.00, 6),
('2025-09-01 12:00:00', 'credito', 13000.00, 7), ('2025-09-01 17:30:00', 'efectivo', 21000.00, 8),
('2025-08-31 10:15:00', 'debito', 5000.00, 9), ('2025-08-31 13:40:00', 'online', 9000.00, 10),
('2025-08-30 11:00:00', 'efectivo', 6500.00, 11), ('2025-08-30 16:00:00', 'credito', 16000.00, 12),
('2025-08-29 18:00:00', 'debito', 3500.00, 13), ('2025-08-29 10:00:00', 'efectivo', 8000.00, 14),
('2025-08-28 12:30:00', 'credito', 12000.00, 15), ('2025-08-28 14:45:00', 'online', 10000.00, 16),
('2025-08-27 09:00:00', 'efectivo', 7000.00, 17), ('2025-08-27 11:30:00', 'debito', 14000.00, 18),
('2025-08-26 16:00:00', 'credito', 21000.00, 19), ('2025-08-26 18:15:00', 'efectivo', 4500.00, 20),
('2025-08-25 10:00:00', 'debito', 10500.00, 21), ('2025-08-25 13:00:00', 'credito', 8500.00, 22),
('2025-08-24 15:30:00', 'efectivo', 15000.00, 23), ('2025-08-24 17:45:00', 'debito', 19000.00, 24),
('2025-08-23 11:00:00', 'online', 23000.00, 25), ('2025-08-23 14:00:00', 'efectivo', 5000.00, 26);


INSERT INTO detalle_venta (codigo_producto, item, precio_unitario, subtotal, numero_venta) VALUES
(1, 'Galletas Ducales', 2500.00, 2500.00, 1), (3, 'Leche Alquería 1L', 4500.00, 4500.00, 1),
(2, 'Coca Cola 1.5L', 6000.00, 6000.00, 2), (5, 'Salchichón Zenú 500g', 10000.00, 10000.00, 2),
(4, 'Jabón Ariel 500g', 8500.00, 8500.00, 3), (5, 'Salchichón Zenú 500g', 10000.00, 10000.00, 3),
(1, 'Galletas Ducales', 2500.00, 2500.00, 4), (2, 'Coca Cola 1.5L', 6000.00, 6000.00, 5),
(3, 'Leche Alquería 1L', 4500.00, 4500.00, 5), (6, 'Banano', 2000.00, 2000.00, 6),
(7, 'Pan tajado Bimbo', 5500.00, 5500.00, 7), (8, 'Papas Margarita Pollo', 3000.00, 3000.00, 8),
(9, 'Bom Bom Bum', 500.00, 500.00, 9), (10, 'Cigarrillos Marlboro', 10000.00, 10000.00, 10),
(11, 'Chocolatina Jet', 1500.00, 1500.00, 11), (12, 'Jugo de Naranja 1L', 3000.00, 3000.00, 12),
(13, 'Yogurt Alpina 1L', 6000.00, 6000.00, 13), (14, 'Crema Dental Colgate', 4000.00, 4000.00, 14),
(15, 'Queso Pera 250g', 7500.00, 7500.00, 15), (16, 'Ponqué Ramo', 4000.00, 4000.00, 16),
(17, 'Gaseosa Sprite 350ml', 2000.00, 2000.00, 17), (18, 'Huevos Cubeta x 30', 18000.00, 18000.00, 18),
(19, 'Papel Higiénico Familia', 15000.00, 15000.00, 19), (20, 'Jamón de Cerdo', 12000.00, 12000.00, 20),
(21, 'Atún Van Camp´s', 5500.00, 5500.00, 21), (22, 'Agua Cristal 600ml', 1500.00, 1500.00, 22),
(23, 'Mantequilla Alpina 250g', 5000.00, 5000.00, 23), (24, 'Limpia Pisos Fabuloso', 7000.00, 7000.00, 24),
(25, 'Chorizo Santarrosano', 9000.00, 9000.00, 25), (26, 'Arroz Diana 500g', 3000.00, 3000.00, 26),
(27, 'Cerveza Aguila Lata', 3000.00, 3000.00, 27), (28, 'Cuajada La Cabaña', 8000.00, 8000.00, 28),
(29, 'Desinfectante Lysol', 12000.00, 12000.00, 29), (30, 'Mortadela Zenú 500g', 9500.00, 9500.00, 30),
(1, 'Galletas Ducales', 2500.00, 2500.00, 31), (2, 'Coca Cola 1.5L', 6000.00, 6000.00, 32),
(3, 'Leche Alquería 1L', 4500.00, 4500.00, 33), (4, 'Jabón Ariel 500g', 8500.00, 8500.00, 34),
(5, 'Salchichón Zenú 500g', 10000.00, 10000.00, 35), (6, 'Banano', 2000.00, 2000.00, 36),
(7, 'Pan tajado Bimbo', 5500.00, 5500.00, 37), (8, 'Papas Margarita Pollo', 3000.00, 3000.00, 38),
(9, 'Bom Bom Bum', 500.00, 500.00, 39), (10, 'Cigarrillos Marlboro', 10000.00, 10000.00, 40),
(11, 'Chocolatina Jet', 1500.00, 1500.00, 41), (12, 'Jugo de Naranja 1L', 3000.00, 3000.00, 42),
(13, 'Yogurt Alpina 1L', 6000.00, 6000.00, 43), (14, 'Crema Dental Colgate', 4000.00, 4000.00, 44),
(15, 'Queso Pera 250g', 7500.00, 7500.00, 45), (16, 'Ponqué Ramo', 4000.00, 4000.00, 46),
(17, 'Gaseosa Sprite 350ml', 2000.00, 2000.00, 47), (18, 'Huevos Cubeta x 30', 18000.00, 18000.00, 48),
(19, 'Papel Higiénico Familia', 15000.00, 15000.00, 49), (20, 'Jamón de Cerdo', 12000.00, 12000.00, 50),
(21, 'Atún Van Camp´s', 5500.00, 5500.00, 1), (22, 'Agua Cristal 600ml', 1500.00, 1500.00, 2),
(23, 'Mantequilla Alpina 250g', 5000.00, 5000.00, 3), (24, 'Limpia Pisos Fabuloso', 7000.00, 7000.00, 4),
(25, 'Chorizo Santarrosano', 9000.00, 9000.00, 5), (26, 'Arroz Diana 500g', 3000.00, 3000.00, 6),
(27, 'Cerveza Aguila Lata', 3000.00, 3000.00, 7), (28, 'Cuajada La Cabaña', 8000.00, 8000.00, 8),
(29, 'Desinfectante Lysol', 12000.00, 12000.00, 9), (30, 'Mortadela Zenú 500g', 9500.00, 9500.00, 10),
(31, 'Café Sello Rojo 250g', 7000.00, 7000.00, 11), (32, 'Té Lipton Botella', 4000.00, 4000.00, 12),
(33, 'Avena Alpina', 6500.00, 6500.00, 13), (34, 'Lavaplatos Axión', 5500.00, 5500.00, 14),
(35, 'Bacon Ahumado', 15000.00, 15000.00, 15), (36, 'Pera', 3000.00, 3000.00, 16),
(37, 'Pan de Yuca', 2500.00, 2500.00, 17), (38, 'Doritos', 3500.00, 3500.00, 18),
(39, 'Gomitas Trululu', 2000.00, 2000.00, 19), (40, 'Cigarrillos Lucky Strike', 9000.00, 9000.00, 20),
(41, 'Leche Condensada', 4500.00, 4500.00, 21), (42, 'Jugo Hit', 2500.00, 2500.00, 22),
(43, 'Queso Mozzarella', 10000.00, 10000.00, 23), (44, 'Cloro Blanqueador', 4000.00, 4000.00, 24),
(45, 'Jamón de Pollo', 8500.00, 8500.00, 25), (46, 'Azúcar 1kg', 6000.00, 6000.00, 26),
(47, 'Té Hindú', 3000.00, 3000.00, 27), (48, 'Margarina La Fina', 4000.00, 4000.00, 28),
(49, 'Suavizante Downy', 9000.00, 9000.00, 29), (50, 'Salami', 11000.00, 11000.00, 30);
