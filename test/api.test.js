


const request = require("supertest");
const app = require("../index");



describe("User API Tests", () => {
    let authToken = "";
    let adminToken = "";
    let productId = "";
    it("Post /register | Register new user ", async () => {
        // No existing user
        const response = await request(app).post("/api/user/create").send({
            firstName: "test",
            lastName: "test",
            email: "test@gmail.com",
            password: "12345678",
            userName: "test",
            phoneNumber: "1234567899",
        });
        if (response.statusCode === 201) {
            expect(response.body.message).toEqual("User Created successfully");
        } else {
            expect(response.body.message).toEqual(
                "User Already Exist!"
            );
        }
    });
    it("Post /register | Register new owner ", async () => {
        // No existing user
        const response = await request(app).post("/api/user/create").send({
            firstName: "test",
            lastName: "test",
            email: "shayam@gmail.com",
            password: "12345678",
            userName: "test111",
            phoneNumber: "124356789",
            isAdmin: true,
        });

        if (response.body.sucess == true) {
            expect(response.body.message).toEqual("User Created Sucesfully");
        } else {
            expect(response.body.message).toEqual("User Already Exist!");
        }
    });

    it("Post /login | Login user", async () => {
        const response = await request(app).post("/api/user/login").send({
            email: "test@gmail.com",
            password: "12345678",
        });
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty("token");
        authToken = response.body.token;
    });
    it("Post /login | Login user", async () => {
        const response = await request(app).post("/api/user/login").send({
          email: "shayam@gmail.com",
          password: "12345678",
        });
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty("token");
        adminToken = response.body.token;
    });

    // Get user by id
    it("Get /get | Get user by id", async () => {
        const response = await request(app)
            .get(`/api/user/current`)
            .set("Authorization", `Bearer ${authToken}`);
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty("user");

        expect(response.body.user).toHaveProperty("email");
        expect(response.body.user.email).toBe("test@gmail.com");
    });

    it("Post /create | Add new product ", async () => {
        const response = await request(app)
            .post("/api/product/create")
            .send({
                productName: "test",
                productDescription: "test",
                productQuantity: 2,
                productPrice: 10,
                productCategory: "test",
            })
            .set("Authorization", `Bearer ${adminToken}`);
        console.log(response.body);
        expect(response.statusCode).toBe(201);
        expect(response.body).toHaveProperty("message");
        console.log(response.body.product);
        productId = response.body.product._id;
    });

    // Get product by product id
    it("Get /get_one_product/:id | Get All products", async () => {
        const response = await request(app)
            .get(`/api/product/get_one_product/${productId}`)
            .set("Authorization", `Bearer ${authToken}`);
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty("product");
        // product has been added
        expect(response.body.product.productName).toBe("test");
    });

    // Delete by product id
    it("Delete /delete | Delete product", async () => {
        const response = await request(app)
            .delete(`/api/product/delete/${productId}`)
            .set("Authorization", `Bearer ${adminToken}`);
        console.log(response.body);
        expect(response.statusCode).toBe(201);
    });

    //order
    it("Post /place_order | Place an order", async () => {
        const response = await request(app)
            .post("/api/order/place_order")
            .send({
                carts: [
                    {
                        productId: productId,
                        quantity: 2,
                    },
                ],
                totalPrice: 20,
                name: "test",
                email: "test@gmail.com",
                street: "test",
                city: "test",
                state: "test",
                zipCode: "test",
                country: "test",
                phone: "test",
            })
            
            .set("Authorization", `Bearer ${authToken}`);
        console.log(response.body);
        expect(response.statusCode).toBe(201);
        expect(response.body).toHaveProperty("message");
    }
    );
    // Get all orders
    it("Get /get_all_orders | Get All orders", async () => {
        const response = await request(app)
            .get(`/api/order/get_all_orders`)
            .set("Authorization", `Bearer ${adminToken}`);
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty("orders");
    });
    
    

});